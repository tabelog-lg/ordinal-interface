/**
 * 校验打包产物：plugins/*.plugin.js 是不是**能用**的自包含 ES module。
 *
 * 做两件事：
 *   1. 用仓库 src/engine/types.ts 里同一套规则检查插件形态（name + 五个方法）
 *   2. 直接调插件跑几条命令，与 C++ 基准对拍（和 tests/diff.cjs 同一批语料）
 *
 * 用法：node tests/verify-plugins.mjs [记号id ...]
 */

import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BIN_DIR = process.env.ONP2_BIN || '/data/workspace/ONP2/bin';
const TIMEOUT = Number(process.env.TIMEOUT || 6000);

const SEQ = ['1', '1,2', '1,2,3', '1,3,2', '1,2,2', '9,1', '9,1,2', '0,9,1'];
/** 矩阵类记号（喂序列串会得到空输出，不能混用候选） */
const MAT_IDS = new Set([
  'bashicu_matrix','bm41','bms_row_extend','bms_stronf','bms_upgradissimo',
  'lels','parented_bms','ppm','ppm00t','ppm3',
]);
const MAT = ['(0)(1)', '(0,0)(1,1)', '(0,0)(1,1)(2,2)', '(0,0,0)(1,1,1)', '(0,0)(1,1)(2,1)'];
const SPEC = {
  kp_hydra: ['()', '(())', '((()))', '(((())))', '(()())'],
  pss_hydra: ['0()', '0(1())', '0(1(2()))', '0(1(2(3())))'],
  remainder_retention: ['1', '1 2', '1 2 3', '1 3 2', '1 2 2'],
  stos: ['1', '1,w', '1,w,w', '1,2', '1,2,w'],
  lels: ['(0)(1)', '(0,0)(1,1)', '(0,0)(1,1)(2,2)'],
  ppm00t: ['(0)', '(0,0)(0,0)(2,0)', '(0,0)(0,0)(2,0)(3,3)'],
  bms_row_extend: ['(0)(1)', '(0,0)(1,1)', '(0,0)(1,1)(2,2)'],
};

function runBatch(exe, cmds) {
  const input = cmds.map((c) => c.join('\n')).join('\n') + '\n';
  const r = spawnSync(exe, [], { input, encoding: 'utf8', timeout: TIMEOUT, maxBuffer: 1 << 26 });
  if (r.error || r.status !== 0) return null;
  const lines = r.stdout.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines.slice(2);
}

const files = readdirSync(resolve(root, 'plugins')).filter((f) => f.endsWith('.plugin.js')).sort();
const only = process.argv.slice(2);
let bad = 0;
let cases = 0;

for (const f of files) {
  const id = basename(f, '.plugin.js');
  if (only.length && !only.includes(id)) continue;

  // 1) 形态检查（与 resolvePlugin 同规则）
  const mod = await import(pathToFileURL(resolve(root, 'plugins', f)).href);
  const plugin = mod.default ?? mod[Object.keys(mod).find((k) => k !== 'default')];
  let shape = '';
  if (!plugin || typeof plugin.name !== 'string') shape = '缺少 name';
  else
    for (const fn of ['fsLimit', 'typeOf', 'pred', 'fs', 'less'])
      if (typeof plugin[fn] !== 'function') shape = shape || `缺少 ${fn}()`;

  if (shape) {
    console.log(`  FAIL ${id.padEnd(26)} ${shape}`);
    bad++;
    continue;
  }

  // 2) 与 C++ 对拍
  const exe = resolve(BIN_DIR, id);
  const limitOut = runBatch(exe, [['1', '0'], ['1', '1'], ['1', '2'], ['1', '3'], ['1', '4']]);
  if (!limitOut) {
    console.log(`  ??   ${id.padEnd(26)} 基准不可运行`);
    bad++;
    continue;
  }
  const base = SPEC[id] || (MAT_IDS.has(id) ? MAT : SEQ);
  let cands = [...new Set([...limitOut.filter((s) => s !== ''), ...base])];
  // 末行全 0 的退化矩阵在原程序里是未定义行为，剔除
  cands = cands.filter((c) => {
    const g = c.match(/\([^)]*\)\s*$/);
    return !(g && /^[0,]+$/.test(g[0].slice(1, -1)));
  });

  const cmds = [];
  for (const c of cands) {
    cmds.push(['2', c]);
    cmds.push(['3', c]);
    for (const n of [0, 1, 2]) cmds.push(['4', String(n), c]);
  }
  const got = runBatch(exe, cmds);
  if (!got || got.length !== cmds.length) {
    console.log(`  ??   ${id.padEnd(26)} 基准批量失败`);
    bad++;
    continue;
  }

  let fail = 0;
  cmds.forEach((cmd, i) => {
    cases++;
    let mine;
    if (cmd[0] === '2') mine = plugin.typeOf(cmd[1]);
    else if (cmd[0] === '3') mine = plugin.pred(cmd[1]);
    else mine = plugin.fs(Number(cmd[1]), cmd[2]);
    if (String(mine) !== got[i]) {
      fail++;
      if (fail <= 2) console.log(`        ${JSON.stringify(cmd)} C++=${got[i]} 插件=${mine}`);
    }
  });
  for (let n = 0; n <= 4; n++) {
    cases++;
    if (String(plugin.fsLimit(n)) !== limitOut[n]) fail++;
  }

  bad += fail;
  console.log(
    `  ${fail === 0 ? 'ok  ' : 'FAIL'} ${id.padEnd(26)} ${String(cmds.length + 5).padStart(4)} 条  ${plugin.name}`,
  );
}

console.log('-'.repeat(60));
console.log(`插件 ${files.length} 个，用例 ${cases} 条，失败 ${bad} 条`);
process.exit(bad === 0 ? 0 : 1);

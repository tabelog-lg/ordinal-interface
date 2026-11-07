/**
 * 差分对拍：TS 版 31 个记号 vs 复原版 C++ 可执行（ONP2/bin/*）。
 *
 * 同一个记号的两份实现（C++ 复原版 / 本 TS 版）来自同一批反编译产物，
 * 所以可以直接拿 C++ 的 stdout 当基准：喂同样的命令串，逐条比输出。
 *
 * 协议提醒：原 exe 是「每个 token 一行」地读的，所以命令要拆成多行发送。
 *
 * 用法：node tests/diff.cjs [记号id ...]
 */

const { spawnSync } = require('child_process');
const path = require('path');

const { NOTATIONS } = require('../dist-cjs/index.js');

const BIN_DIR = process.env.ONP2_BIN || '/data/workspace/ONP2/bin';
const TIMEOUT = Number(process.env.TIMEOUT || 4000);

// ————————————————————————————————————————————————
//  测试语料
// ————————————————————————————————————————————————

// '9,1' / '0,9,1' 是 txar 步进的回归用例：元素值 9 后跟逗号时，
// 原程序用 (v + flzero(v))*100+1 算步进（=2），复原版曾用 (v+bias)*100+1（=3），
// 会多跳一位把 "9,1" 解析成只剩 "9"。
const SEQ = ['1', '1,2', '1,2,3', '1,3,2', '1,2,2', '9,1', '9,1,2', '0,9,1'];
const MAT = ['(0)(1)', '(0,0)(1,1)', '(0,0)(1,1)(2,2)', '(0,0,0)(1,1,1)', '(0,0)(1,1)(2,1)'];

/** 各记号的形态 + 额外候选表达式 */
const SPEC = {
  bashicu_matrix: ['mat'],
  bm41: ['mat'],
  bms_row_extend: ['mat', ['(0)(1)', '(0,0)(1,1)', '(0,0)(1,1)(2,2)']],
  bms_stronf: ['mat'],
  bms_upgradissimo: ['mat'],
  coprime: ['seq'],
  hiun: ['seq'],
  kp_hydra: ['seq', ['()', '(())', '((()))', '(((())))', '(()())']],
  lels: ['mat', ['(0)(1)', '(0,0)(0,1)', '(0,0,0)(0,0,1)']],
  lprss: ['seq'],
  mfss: ['seq'],
  parented_bms: ['mat'],
  ppm: ['mat'],
  ppm00t: ['mat', ['(0)', '(0,0)(0,0)(2,0)(3,3)', '(0,0)(0,0)(2,0)']],
  ppm3: ['mat'],
  pps2: ['seq'],
  pps3: ['seq'],
  pps4: ['seq'],
  pps4_extremely_weak: ['seq'],
  pps4_second: ['seq'],
  pps4_third: ['seq'],
  pps4_weak: ['seq'],
  pps4_v2: ['seq'],
  prss_parented: ['seq'],
  pss_hydra: ['seq', ['0()', '0(1())', '0(1(2()))', '0(1(2(3())))']],
  remainder_retention: ['seq', ['1', '1 2', '1 2 3', '1 3 2', '1 2 2']],
  residue_class: ['seq'],
  simplified_minus2y: ['seq'],
  stos: ['seq', ['1', '1,w', '1,w,w', '1,2', '1,2,w']],
  zero_y: ['seq'],
  zero_y_super_non_lifting: ['seq'],
};

// ————————————————————————————————————————————————
//  跑 C++ 基准
// ————————————————————————————————————————————————

/** 一次进程跑完一批命令；返回输出行数组（已去掉两行横幅），失败返回 null */
function runBatch(exe, cmds) {
  const input = cmds.map((c) => c.join('\n')).join('\n') + '\n';
  const r = spawnSync(exe, [], { input, encoding: 'utf8', timeout: TIMEOUT, maxBuffer: 1 << 26 });
  if (r.error || r.status !== 0) return null;
  const lines = r.stdout.split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines.slice(2); // 去掉 "Ordinal Notation Protocol 2" + 记号名
}

// ————————————————————————————————————————————————
//  主流程
// ————————————————————————————————————————————————

let totalFail = 0;
let totalCases = 0;
const summary = [];

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(NOTATIONS);

for (const id of ids) {
  const plugin = NOTATIONS[id];
  const exe = path.join(BIN_DIR, id);
  const [kind, extra = kind === 'mat' ? MAT : SEQ] = SPEC[id] || ['seq', SEQ];

  // 候选表达式：先用 exe 自己的 limit 生成（基准），再补手写候选
  process.stderr.write(`[..] ${id} limit...\n`);
  const limitOut = runBatch(exe, [[ '1', '0' ], ['1', '1'], ['1', '2'], ['1', '3'], ['1', '4']]);
  if (!limitOut) {
    console.log(`  ??   ${id.padEnd(26)} 无法运行或超时：${exe}`);
    totalFail++;
    summary.push([id, 'EXE-ERR', 0, 0]);
    continue;
  }
  let cands = [...new Set([...limitOut.filter((s) => s !== ''), ...extra])];
  // 末行全 0 的矩阵会让原程序算出 c0 = -1 并越界写（未定义行为），
  // 这种退化输入两边不可能一致，剔除
  if (kind === 'mat')
    cands = cands.filter((c) => {
      const g = c.match(/\([^)]*\)\s*$/);
      return !(g && /^[0,]+$/.test(g[0].slice(1, -1)));
    });

  // 构造全部命令
  const cmds = [];
  const expect = []; // [期望来源] 用 TS 算，exe 输出另存
  for (const c of cands) {
    cmds.push(['2', c]);
    cmds.push(['3', c]);
    for (const n of [0, 1, 2, 3]) cmds.push(['4', String(n), c]);
  }
  for (const a of cands)
    for (const b of cands) cmds.push(['5', a, b]);

  process.stderr.write(`[..] ${id} batch ${cmds.length}...\n`);
  const got = runBatch(exe, cmds);
  if (!got || got.length !== cmds.length) {
    console.log(`  ??   ${id.padEnd(26)} 批量运行失败（${got ? got.length : 'null'}/${cmds.length} 行）`);
    totalFail++;
    summary.push([id, 'BATCH-ERR', 0, cmds.length]);
    continue;
  }

  // 逐条比对
  let fail = 0;
  const samples = [];
  cmds.forEach((cmd, i) => {
    totalCases++;
    const want = got[i];
    let mine;
    if (cmd[0] === '2') mine = plugin.typeOf(cmd[1]);
    else if (cmd[0] === '3') mine = plugin.pred(cmd[1]);
    else if (cmd[0] === '4') mine = plugin.fs(Number(cmd[1]), cmd[2]);
    else mine = plugin.less(cmd[1], cmd[2]) ? '2' : '1';
    const mineStr = String(mine);
    if (mineStr !== want) {
      fail++;
      if (samples.length < 4) samples.push({ cmd, want, mine: mineStr });
    }
  });

  // 另外单测命令 1（limit）
  for (let n = 0; n <= 4; n++) {
    totalCases++;
    const want = limitOut[n];
    const mine = plugin.fsLimit(n);
    if (String(mine) !== want) {
      fail++;
      if (samples.length < 4) samples.push({ cmd: ['1', String(n)], want, mine: String(mine) });
    }
  }

  totalFail += fail;
  const ok = fail === 0;
  console.log(
    `  ${ok ? 'ok  ' : 'FAIL'} ${id.padEnd(26)} ${String(cmds.length + 5).padStart(4)} 条` +
      (ok ? '' : `  不一致 ${fail}`),
  );
  for (const s of samples)
    console.log(`        命令 ${JSON.stringify(s.cmd)}  C++=${JSON.stringify(s.want)}  TS=${JSON.stringify(s.mine)}`);
  summary.push([id, ok ? 'ok' : 'FAIL', fail, cmds.length + 5]);
}

console.log('-'.repeat(60));
console.log(`合计 ${totalCases} 条，不一致 ${totalFail} 条`);
process.exit(totalFail === 0 ? 0 : 1);

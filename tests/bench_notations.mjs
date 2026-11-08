/**
 * 全记号性能基准（覆盖 src/notations/ 下全部 30 个插件 + 引擎组合动作）。
 *
 * 设计为放在仓库 tests/ 下，与现有 npm run bench 同样的「esbuild 打包后 node 跑」模式：
 *   esbuild tests/bench_notations.mjs --bundle --platform=node --format=esm \
 *     --outfile=node_modules/.cache/bench_notations.mjs --log-level=warning
 *   node node_modules/.cache/bench_notations.mjs
 *
 * 每个记号在**独立子进程**里测（主进程逐项 timeout + 限制堆大小），
 * 这样某个记号的死循环 / OOM 不会拖死整轮，也不会吃满机器内存。
 *
 * 选项：
 *   --timeout SEC        单记号上限，默认 20
 *   --heap MB            worker 的 --max-old-space-size，默认 256
 *   --json PATH          额外把原始数据写成 JSON
 *   --only IDS           只测指定记号（逗号分隔）
 *   --worker ID          内部用：只跑一个记号并输出 @@JSON
 *
 * 输出单位是 **ms / 次**。五个原语直接打插件（绕开 EngineHost 缓存），
 * firstExceeding / validate 每次新建 EngineHost（冷路径），UI 项是稳态绘制。
 *
 * 注：4 个 PPS4 弱化变体的 treeClick 会触发 src/core/tree.ts 的连续展开护栏
 * （单次 1 万节点），数值偏高属预期；护栏之前它们会直接 OOM 杀掉进程。
 */
import { NOTATIONS } from '../src/notations/index';
import { EngineHost } from '../src/engine/host';
import { RulerEngine } from '../src/core/ruler';
import { TreeEngine } from '../src/core/tree';
import { spawnSync } from 'node:child_process';

const argv = process.argv.slice(2);
const LIMIT = 'Limit';
const noop = { clear() {}, drawCenter() {}, drawTick() {} };

function arg(name, def) {
  const i = argv.indexOf(name);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : def;
}

// ────────────────────────────────────────────────────────────
// worker：测一个记号
// ────────────────────────────────────────────────────────────
if (argv[0] === '--worker') {
  const id = argv[1];
  const p = NOTATIONS[id];
  const out = { id };
  if (!p) { console.log('@@' + JSON.stringify({ id, error: 'unknown id' })); process.exit(0); }
  out.name = p.name;

  const seeds = [];
  try {
    for (let i = 0; i < 6; i++) seeds.push(p.fsLimit(i));
    const base = p.fsLimit(0);
    for (const n of [1, 2, 3]) { try { seeds.push(p.fs(n, base)); } catch { /* 忽略 */ } }
  } catch (e) { out.seedError = String(e.message).slice(0, 80); }
  const uniq = [...new Set(seeds)].filter((s) => typeof s === 'string' && s.length > 0);
  const s0 = uniq[0] ?? '0';
  const s1 = uniq[Math.min(1, uniq.length - 1)] ?? s0;
  out.nseed = uniq.length;
  out.len0 = s0.length;

  const ms = (fn, n) => {
    for (let i = 0; i < Math.min(n, 20); i++) fn(i);
    const t0 = performance.now();
    for (let i = 0; i < n; i++) fn(i);
    return (performance.now() - t0) / n;
  };
  const safe = (key, fn, n) => {
    try { out[key] = +ms(fn, n).toFixed(5); }
    catch (e) { out[key] = 'ERR:' + String(e.message).slice(0, 70); }
  };

  safe('typeOf', () => p.typeOf(s0), 2000);
  safe('less', () => p.less(s0, s1), 2000);
  safe('pred', () => p.pred(s0), 1000);
  safe('fsLimit', (i) => p.fsLimit(i % 8), 1000);
  safe('fs', () => p.fs(1, s0), 300);
  safe('firstExceeding', () => {
    const h = new EngineHost(); h.load(p); return h.firstExceeding(s0, LIMIT);
  }, 100);
  safe('validate', () => {
    const h = new EngineHost(); h.load(p); return h.validate(s0);
  }, 10);

  try {
    const h = new EngineHost(); h.load(p);
    const r = new RulerEngine(h);
    r.height = 800; r.tickLength = 200; r.fontHeight = 32;
    r.textHalfHeight = 16; r.denseTickLimit = 65;
    r.init();
    safe('rulerDraw', () => r.draw(noop, false), 200);
    safe('rulerWheelDraw', () => { r.wheel(true, 0); r.draw(noop, false); }, 60);
    const t = new TreeEngine(h); t.init();
    safe('treeClick', () => { t.init(); t.click(10, 43, true); }, 60);
  } catch (e) { out.uiError = String(e.message).slice(0, 80); }

  console.log('@@' + JSON.stringify(out));
  process.exit(0);
}

// ────────────────────────────────────────────────────────────
// 主进程：逐记号 spawn worker
// ────────────────────────────────────────────────────────────
const timeout = Number(arg('--timeout', 20));
const heap = Number(arg('--heap', 256));
const only = arg('--only', '');
const ids = only ? only.split(',') : Object.keys(NOTATIONS);
const self = process.argv[1];
const rows = [];

for (const id of ids) {
  const r = spawnSync(process.execPath,
    [`--max-old-space-size=${heap}`, self, '--worker', id],
    { encoding: 'utf8', timeout: timeout * 1000, maxBuffer: 8 * 1024 * 1024 });
  let d;
  const line = (r.stdout || '').split('\n').find((x) => x.startsWith('@@'));
  if (line) d = JSON.parse(line.slice(2));
  else if (r.error && r.error.code === 'ETIMEDOUT') d = { id, error: `TIMEOUT >${timeout}s` };
  else d = { id, error: `WORKER FAILED ${r.status ?? '?'}: ${String(r.stderr || '').slice(-120)}` };
  rows.push(d);
}

const keys = ['typeOf', 'less', 'pred', 'fsLimit', 'fs', 'firstExceeding', 'validate',
  'rulerDraw', 'rulerWheelDraw', 'treeClick'];
const num = (x, k) => (typeof x[k] === 'number' ? x[k] : null);
const fmt = (v) => (v === null ? '   —   ' : v.toFixed(5).padStart(8));

console.log(`\n全记号性能基准  ${rows.length} 个记号  单位 ms/次  (timeout ${timeout}s, heap ${heap}MB)\n`);
console.log('| 记号 | ' + keys.map((k) => k.slice(0, 8)).join(' | ') + ' |');
console.log('|' + '---|'.repeat(keys.length + 1));
for (const x of rows) {
  console.log('| ' + x.id.padEnd(28) + ' | ' + keys.map((k) => fmt(num(x, k))).join(' | ') + ' |'
    + (x.error ? ' **' + x.error.slice(0, 40) + '**' : ''));
}

const ok = rows.filter((x) => !x.error);
console.log('\n── 分组均值 ──');
const MAT = /^(bashicu_matrix|bm41|bms_|parented_bms|ppm|lels)/;
for (const [label, group] of [['矩阵系', ok.filter((x) => MAT.test(x.id))],
                             ['其它', ok.filter((x) => !MAT.test(x.id))]]) {
  const cells = keys.map((k) => {
    const v = group.map((x) => num(x, k)).filter((v) => v !== null);
    return k + '=' + (v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(5) : '—');
  });
  console.log(`  ${label} (${group.length} 个)  ` + cells.join('  '));
}
console.log('\n── 最慢 TOP3 ──');
for (const k of ['less', 'firstExceeding', 'fs', 'rulerDraw']) {
  const top = ok.filter((x) => num(x, k) !== null).sort((a, b) => b[k] - a[k]).slice(0, 3);
  console.log(`  ${k.padEnd(16)} ` + top.map((x) => `${x.id}=${x[k].toFixed(5)}`).join('  '));
}
const bad = rows.filter((x) => x.error);
console.log(`\n异常 ${bad.length} 个：` + (bad.length ? bad.map((x) => x.id + '(' + x.error.slice(0, 34) + ')').join(', ') : '无'));

const jsonPath = arg('--json', '');
if (jsonPath) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(jsonPath, JSON.stringify(rows, null, 2), 'utf8');
  console.log('\n原始数据 → ' + jsonPath);
}
console.log('\n说明：firstExceeding / validate 每次新建 EngineHost（冷路径）；'
  + '五个原语直接打插件，绕开宿主缓存；UI 项为稳态。'
  + 'OOM 的记号会由主进程 timeout 记为异常，不影响其它记号。');

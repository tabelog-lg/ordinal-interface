/**
 * 逻辑自检：不依赖 DOM，直接驱动引擎 / 序数尺 / 展开树。
 * 用 esbuild 打包后由 node 运行。
 */

import { omega2Notation, _internal } from '../src/engine/omega2';
import { omegaOmegaNotation, _internal as _oo } from '../src/engine/omegaOmega';
import { EngineHost } from '../src/engine/host';
import { RulerEngine, type RulerPainter } from '../src/core/ruler';
import { TreeEngine } from '../src/core/tree';

let failures = 0;
function eq(label: string, actual: unknown, expected: unknown): void {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${label}: ${JSON.stringify(actual)}${ok ? '' : ' ≠ ' + JSON.stringify(expected)}`);
}
function ok(label: string, cond: boolean): void {
  if (!cond) failures++;
  console.log(`${cond ? '  ok  ' : ' FAIL '} ${label}`);
}
function section(name: string): void {
  console.log('\n── ' + name + ' ' + '─'.repeat(Math.max(0, 50 - name.length)));
}

// ════════════════════════════════════════════════
section('1. Omega2 记号：表达式解析 / 格式化');
const { parse, format } = _internal;
eq('parse("0")', format(parse('0')), '0');
eq('parse("12")', format(parse('12')), '12');
eq('parse("w")', format(parse('w')), 'w');
eq('parse("w*3")', format(parse('w*3')), 'w*3');
eq('parse("w*3+7")', format(parse('w*3+7')), 'w*3+7');
eq('parse("w+7")', format(parse('w+7')), 'w+7');
eq('parse("w2") 兼容写法', format(parse('w2')), 'w*2');
eq('parse("Limit")', format(parse('Limit')), 'Limit');
eq('parse("xyz") 兜底', format(parse('xyz')), '0');

section('2. Omega2 记号：五个 ONP2 命令');
const p = omega2Notation;
eq('命令2 typeOf("0")', p.typeOf('0'), '1');
eq('命令2 typeOf("5")', p.typeOf('5'), '2');
eq('命令2 typeOf("w")', p.typeOf('w'), '3');
eq('命令2 typeOf("w*3")', p.typeOf('w*3'), '3');
eq('命令2 typeOf("Limit")', p.typeOf('Limit'), '3');
eq('命令3 pred("5")', p.pred('5'), '4');
eq('命令3 pred("w")', p.pred('w'), '0');
eq('命令3 pred("w*3+7")', p.pred('w*3+7'), 'w*3+6');
eq('命令3 pred("w*3")', p.pred('w*3'), 'w*2');
eq('命令1 fsLimit(0)', p.fsLimit(0), '0');
eq('命令1 fsLimit(3)', p.fsLimit(3), 'w*3');
eq('命令4 fs(0,"w")', p.fs(0, 'w'), '0');
eq('命令4 fs(3,"w")', p.fs(3, 'w'), '3');
eq('命令4 fs(2,"w*3")', p.fs(2, 'w*3'), 'w*2+2');
eq('命令4 fs(4,"Limit")', p.fs(4, 'Limit'), 'w*4');
ok('命令5 less("w","w*2")', p.less('w', 'w*2'));
ok('命令5 less("w+7","w*2")', p.less('w+7', 'w*2'));
ok('命令5 !less("Limit","w")', !p.less('Limit', 'w'));
ok('命令5 less("w","Limit")', p.less('w', 'Limit'));

// ════════════════════════════════════════════════
section('3. 宿主：Limit / 0 短路 + 表达式校验');
const h = new EngineHost();
h.load(p);
eq('queryType 短路 Limit', h.queryType('Limit'), '3');
ok('isLessThan 短路 Limit 在左', !h.isLessThan('Limit', 'w'));
ok('isLessThan 短路 Limit 在右', h.isLessThan('w', 'Limit'));
for (const e of ['0', 'Limit', '5', 'w', 'w*3', 'w*3+7', 'w+7', '12']) {
  ok(`validate("${e}") 合法`, h.validate(e));
}
for (const e of ['xyz', '', 'w**', 'Limit+1']) {
  ok(`validate("${e}") 非法`, !h.validate(e));
}
eq('firstExceeding("0","Limit")', h.firstExceeding('0', 'Limit').expr, 'w');
eq('firstExceeding("0","w")', h.firstExceeding('0', 'w').expr, '1');
eq('firstExceeding("w*2","Limit").index', h.firstExceeding('w*2', 'Limit').index, 3);

// ════════════════════════════════════════════════
section('4. 序数尺：初始化 + 无限缩放');
const ruler = new RulerEngine(h);
ruler.height = 800;
ruler.tickLength = 200;
ruler.fontHeight = 32;
ruler.textHalfHeight = 16;
ruler.denseTickLimit = 65;
ruler.init();

eq('根节点表达式', ruler.rootNode.expression, 'w');
eq('下界节点表达式', ruler.lowerNode.expression, '1');
eq('上界节点表达式', ruler.upperNode.expression, 'w*2');

const collect = (): { labels: string[]; painter: RulerPainter } => {
  const labels: string[] = [];
  return {
    labels,
    painter: {
      clear: () => labels.splice(0),
      drawCenter: (y, expr) => labels.push(`*${expr}@${y}`),
      drawTick: (y, expr, _lim, showText) => {
        if (showText && expr !== null) labels.push(`${expr}@${y}`);
      },
    },
  };
};

let c = collect();
ruler.draw(c.painter, false);
ok('初始绘制有刻度 (' + c.labels.length + ' 条)', c.labels.length > 0);
console.log('     刻度: ' + c.labels.slice(0, 12).join('  '));

// 连续拉近 60 次（鼠标在画布中心），不应崩溃
let zoomError = '';
try {
  for (let i = 0; i < 60; i++) ruler.wheel(false, 0);
} catch (e) {
  zoomError = (e as Error).message;
}
ok('连续拉近 60 次不崩溃' + (zoomError ? ' —— ' + zoomError : ''), zoomError === '');
ok('viewSpan 有限且为正: ' + ruler.viewSpan.toFixed(6), Number.isFinite(ruler.viewSpan) && ruler.viewSpan > 0);
ok('viewCenter 有限: ' + ruler.viewCenter.toFixed(6), Number.isFinite(ruler.viewCenter));
c = collect();
ruler.draw(c.painter, false);
ok('拉近后仍有刻度 (' + c.labels.length + ' 条)', c.labels.length > 0);
console.log('     刻度: ' + c.labels.slice(0, 12).join('  '));

// 带鼠标偏移地拉近：视窗会漂移，只要求不崩溃、参数保持有限
const ruler3 = new RulerEngine(h);
ruler3.height = 800;
ruler3.tickLength = 200;
ruler3.fontHeight = 32;
ruler3.textHalfHeight = 16;
ruler3.denseTickLimit = 65;
ruler3.init();
zoomError = '';
try {
  for (let i = 0; i < 60; i++) ruler3.wheel(false, 40);
} catch (e) {
  zoomError = (e as Error).message;
}
ok('带鼠标偏移拉近 60 次不崩溃' + (zoomError ? ' —— ' + zoomError : ''), zoomError === '');
ok(
  '漂移后参数仍有限',
  Number.isFinite(ruler3.viewSpan) && Number.isFinite(ruler3.viewCenter) && ruler3.viewSpan > 0,
);

// 连续拉远 120 次（会撞到最顶层，正是原 bug 2 的越界路径）
zoomError = '';
try {
  for (let i = 0; i < 120; i++) ruler.wheel(true, -40);
} catch (e) {
  zoomError = (e as Error).message;
}
ok('连续拉远 120 次不崩溃' + (zoomError ? ' —— ' + zoomError : ''), zoomError === '');
ok('拉远后 viewSpan ≤ 0.5: ' + ruler.viewSpan.toFixed(6), ruler.viewSpan <= 0.5001);
ok('拉远后回到最顶层', ruler.upperNode === ruler.rootNode.adj[3]);
ok(
  '拉远后视窗在界内',
  ruler.viewCenter >= ruler.viewSpan - 1e-6 && ruler.viewCenter + ruler.viewSpan <= 1 + 1e-6,
);

// 再拉近回去，反复横跳
zoomError = '';
try {
  for (let i = 0; i < 40; i++) {
    ruler.wheel(false, 30);
    ruler.wheel(true, -30);
  }
} catch (e) {
  zoomError = (e as Error).message;
}
ok('反复横跳 40 轮不崩溃' + (zoomError ? ' —— ' + zoomError : ''), zoomError === '');

// 密集刻度开启时也要能画
c = collect();
ruler.draw(c.painter, true);
ok('密集刻度模式可绘制 (' + c.labels.length + ' 条)', c.labels.length > 0);

// ════════════════════════════════════════════════
section('5. 展开树：点击展开（含 bug 1 修复验证）');
const tree = new TreeEngine(h);
tree.init();
const dump = (): string => {
  const out: string[] = [];
  let n = tree.tree.first;
  while (n) {
    out.push(`${n.value.expression}[${n.value.levels.join(',')}]`);
    n = n.next;
  }
  return out.join('  ');
};
eq('初始两行', dump(), 'Limit[-1,0,0,0]  0[-1,0,0,0]');

ok('点击第一行 → 插入首超项', tree.click(10, 43, false));
console.log('     ' + dump());
eq('展开后为三行', dump(), 'Limit[1,0,0,0]  w[-1,1,0,1]  0[-1,0,0,0]');

ok('再点同一行 → 取基本列下一项', tree.click(10, 43, false));
console.log('     ' + dump());
// ★ 修复要点：Levels(0) 从 1 递增到 2，得到 ω·2；原程序会把像素坐标写进去
eq('第二次点击得到 w*2', dump(), 'Limit[2,0,0,0]  w*2[-1,1,1,1]  w[-1,1,0,1]  0[-1,0,0,0]');

ok('第三次点击得到 w*3', tree.click(10, 43, false));
eq('第三次点击', tree.tree.first!.next!.value.expression, 'w*3');

// 点第二行（w*3，极限序数）展开
ok('点击 w*3 行', tree.click(53, 43, false));
console.log('     ' + dump());

// 连续展开
const tree2 = new TreeEngine(h);
tree2.init();
ok('连续展开', tree2.click(10, 43, true));
console.log('     连续展开结果: ' + (() => {
  const out: string[] = [];
  let n = tree2.tree.first;
  while (n) {
    out.push(n.value.expression);
    n = n.next;
  }
  return out.join('  ');
})());
ok('连续展开后末行仍是 0', tree2.tree.last!.value.expression === '0');

// 滚动
let scrollError = '';
try {
  for (let i = 0; i < 30; i++) tree2.wheel(true, 43);
  for (let i = 0; i < 60; i++) tree2.wheel(false, 43);
  for (let i = 0; i < 10; i++) tree2.wheel(true, 43);
} catch (e) {
  scrollError = (e as Error).message;
}
ok('滚动不崩溃' + (scrollError ? ' —— ' + scrollError : ''), scrollError === '');
ok('firstVisible 仍有效', tree2.firstVisible !== null);

// ════════════════════════════════════════════════
section('6. 第二个内置记号 OmegaOmega (w^w)');
const h2 = new EngineHost();
h2.load(omegaOmegaNotation);
const w = omegaOmegaNotation;

eq('归一化 "w^2*3+w*2+5"', _oo.format(_oo.parse('w^2*3+w*2+5')), 'w^2*3+w*2+5');
eq('归一化 "w*3+7"', _oo.format(_oo.parse('w*3+7')), 'w*3+7');
eq('归一化 "w2" 兼容写法', _oo.format(_oo.parse('w2')), 'w^2');
eq('归一化 "w+w"', _oo.format(_oo.parse('w+w')), 'w*2');
eq('归一化 "0"', _oo.format(_oo.parse('0')), '0');
eq('归一化 "Limit"', _oo.format(_oo.parse('Limit')), 'Limit');

eq('命令2 typeOf("0")', w.typeOf('0'), '1');
eq('命令2 typeOf("5") 后继', w.typeOf('5'), '2');
eq('命令2 typeOf("w^2+5") 后继', w.typeOf('w^2+5'), '2');
eq('命令2 typeOf("w") 极限', w.typeOf('w'), '3');
eq('命令2 typeOf("w^2+w*3") 极限', w.typeOf('w^2+w*3'), '3');
eq('命令2 typeOf("Limit")', w.typeOf('Limit'), '3');

eq('命令3 pred("w^2+5")', w.pred('w^2+5'), 'w^2+4');
eq('命令3 pred("w*3") 兜底', w.pred('w*3'), 'w*2');
eq('命令3 pred("w") 兜底', w.pred('w'), '0');

eq('命令1 fsLimit(0)', w.fsLimit(0), 'w');
eq('命令1 fsLimit(1)', w.fsLimit(1), 'w^2');
eq('命令1 fsLimit(2)', w.fsLimit(2), 'w^3');
eq('命令4 fs(3,"w^2")', w.fs(3, 'w^2'), 'w*3');
eq('命令4 fs(0,"w*3")', w.fs(0, 'w*3'), 'w*2');
eq('命令4 fs(5,"w*3")', w.fs(5, 'w*3'), 'w*2+5');
eq('命令4 fs(2,"w^2+w*3")', w.fs(2, 'w^2+w*3'), 'w^2+w*2+2');

ok('命令5 less("w","w^2")', w.less('w', 'w^2'));
ok('命令5 less("w*9","w^2")', w.less('w*9', 'w^2'));
ok('命令5 !less("w^2","w*9")', !w.less('w^2', 'w*9'));
ok('命令5 less("w^2","w^2+w")', w.less('w^2', 'w^2+w'));
ok('命令5 less("w^2+w*3","Limit")', w.less('w^2+w*3', 'Limit'));
ok('命令5 !less("Limit","w")', !w.less('Limit', 'w'));

// 基本列必须严格递增 —— FirstExceeding 是线性扫描，不递增会一直扫到保护上限
const seqInc = (base: string, n = 12): boolean => {
  let prev: string | null = null;
  for (let i = 0; i < n; i++) {
    const t = w.fs(i, base);
    if (prev !== null && !w.less(prev, t)) return false;
    prev = t;
  }
  return true;
};
for (const base of ['w^2', 'w*3', 'w^3+w^2*2', 'w^2+w', 'w^5']) {
  ok(`基本列严格递增: ${base}`, seqInc(base));
}
ok(
  '基本列严格递增: Limit',
  (() => {
    let prev: string | null = null;
    for (let i = 0; i < 12; i++) {
      const t = w.fsLimit(i);
      if (prev !== null && !w.less(prev, t)) return false;
      prev = t;
    }
    return true;
  })(),
);

for (const e of ['0', 'Limit', '5', 'w', 'w^2', 'w^2*3+w*2+5', 'w^3+w']) {
  ok(`validate("${e}") 合法`, h2.validate(e));
}
ok('validate("xyz") 非法', !h2.validate('xyz'));
ok('validate("w^") 非法', !h2.validate('w^'));
eq('firstExceeding("0","Limit")', h2.firstExceeding('0', 'Limit').expr, 'w');
eq('firstExceeding("w^2","Limit")', h2.firstExceeding('w^2', 'Limit').expr, 'w^3');
eq('firstExceeding("w*3","w^2")', h2.firstExceeding('w*3', 'w^2').expr, 'w*4');

section('7. ω^ω 记号下的序数尺与展开树');
const r2 = new RulerEngine(h2);
r2.height = 800;
r2.tickLength = 200;
r2.fontHeight = 32;
r2.textHalfHeight = 16;
r2.denseTickLimit = 65;
r2.init();
eq('ω^ω 尺子根节点', r2.rootNode.expression, 'w');
eq('ω^ω 尺子下界节点', r2.lowerNode.expression, '1');
eq('ω^ω 尺子上界节点', r2.upperNode.expression, 'w^2');

const c2 = { labels: [] as string[], painter: {} as RulerPainter };
c2.painter = {
  clear: () => c2.labels.splice(0),
  drawCenter: (y, expr) => c2.labels.push(`*${expr}@${y}`),
  drawTick: (y, expr, _lim, showText) => {
    if (showText && expr !== null) c2.labels.push(`${expr}@${y}`);
  },
};
r2.draw(c2.painter, false);
ok('ω^ω 尺子初始有刻度 (' + c2.labels.length + ' 条)', c2.labels.length > 0);
console.log('     刻度: ' + c2.labels.slice(0, 10).join('  '));

let ze2 = '';
try {
  for (let i = 0; i < 40; i++) r2.wheel(false, 0);
} catch (e) {
  ze2 = (e as Error).message;
}
ok('ω^ω 尺子拉近 40 次不崩溃' + (ze2 ? ' —— ' + ze2 : ''), ze2 === '');
r2.draw(c2.painter, false);
ok('拉近后仍有刻度 (' + c2.labels.length + ' 条)', c2.labels.length > 0);

ze2 = '';
try {
  for (let i = 0; i < 100; i++) r2.wheel(true, -30);
} catch (e) {
  ze2 = (e as Error).message;
}
ok('ω^ω 尺子拉远 100 次不崩溃' + (ze2 ? ' —— ' + ze2 : ''), ze2 === '');
ok('ω^ω 尺子拉远后回到最顶层', r2.upperNode === r2.rootNode.adj[3]);
ok('ω^ω 尺子参数仍有限', Number.isFinite(r2.viewSpan) && Number.isFinite(r2.viewCenter));

const t3 = new TreeEngine(h2);
t3.init();
ok('ω^ω 树点击第一行', t3.click(10, 43, false));
eq('ω^ω 树第一次点击插入 w', t3.tree.first?.next?.value.expression, 'w');
t3.click(10, 43, false);
eq('ω^ω 树第二次点击插入 w^2', t3.tree.first?.next?.value.expression, 'w^2');
t3.click(10, 43, false);
eq('ω^ω 树第三次点击插入 w^3', t3.tree.first?.next?.value.expression, 'w^3');

// ════════════════════════════════════════════════
// ════════════════════════════════════════════
section('8. 性能优化的等价性：二分 vs 线性扫描');

/**
 * 暴力线性扫描 —— 与 host.firstExceeding（指数搜索 + 二分）对照。
 * 两者必须对**所有**输入给出同样的结果，否则二分实现有偏差。
 */
function bruteFirstExceeding(
  host: EngineHost,
  a: string,
  base: string,
): { expr: string; index: number } {
  let index = 0;
  let term = host.getFSTerm(index, base);
  let guard = 0;
  while (!host.isLessThan(a, term)) {
    if (++guard > 200000) throw new Error('线性扫描超限');
    index += 1;
    term = host.getFSTerm(index, base);
  }
  return { expr: term, index };
}

const CASES: [string, EngineHost, (readonly [string, string])[]][] = [
  [
    'Omega2',
    h,
    [
      ['0', 'Limit'], ['1', 'Limit'], ['2', 'Limit'], ['w', 'Limit'],
      ['w*1', 'Limit'], ['w*2', 'Limit'], ['w*7', 'Limit'],
      ['w*31', 'Limit'], ['w*32', 'Limit'], ['w*33', 'Limit'],
      ['w*100', 'Limit'], ['w*999', 'Limit'], ['w+5', 'Limit'],
      ['0', 'w'], ['5', 'w'], ['1', 'w*3'], ['w*2+5', 'w*3'],
    ],
  ],
  [
    'w^w',
    h2,
    [
      ['0', 'Limit'], ['w', 'Limit'], ['w^2', 'Limit'], ['w^5', 'Limit'],
      ['0', 'w^2'], ['w', 'w^2'], ['w*7', 'w^2'],
      ['w*31', 'w^2'], ['w*32', 'w^2'], ['w*33', 'w^2'],
      ['w*100', 'w^2'], ['w*500', 'w^2'],
      ['w*2+3', 'w*3'], ['w^2+5', 'w^2+w'], ['w^2+w*7', 'w^3'],
    ],
  ],
];

for (const [label, host, cases] of CASES) {
  for (const [a, base] of cases) {
    const fast = host.firstExceeding(a, base);
    const slow = bruteFirstExceeding(host, a, base);
    eq(
      `${label} firstExceeding("${a}","${base}") 与线性扫描一致`,
      `${fast.index}:${fast.expr}`,
      `${slow.index}:${slow.expr}`,
    );
  }
}

// 二分最容易差一位的地方：答案恰好落在 2 的幂次附近
for (const n of [1, 2, 3, 4, 7, 8, 15, 16, 31, 32, 63, 64, 127, 128]) {
  const fast = h.firstExceeding(`w*${n}`, 'Limit');
  const slow = bruteFirstExceeding(h, `w*${n}`, 'Limit');
  eq(`2 的幂次边界 w*${n}`, `${fast.index}:${fast.expr}`, `${slow.index}:${slow.expr}`);
}

section('9. 缓存：容量上限与切换记号时清空');

{
  const hx = new EngineHost();
  hx.load(omega2Notation);
  for (let i = 0; i < 60000; i++) hx.getFSTerm(i, 'Limit');
  ok(`缓存有容量上限（灌 60000 条后剩 ${hx.cacheSize} 条）`, hx.cacheSize < 60000);
  ok(`缓存非空（${hx.cacheSize} 条）`, hx.cacheSize > 0);

  // 切换记号必须清空缓存，否则两套记号的结果会串味
  hx.load(omegaOmegaNotation);
  eq('切换记号后缓存清空', hx.cacheSize, 0);
  eq('切换后类型查询正确', hx.queryType('w*3'), '3');
}

{
  const hy = new EngineHost();
  hy.load(omega2Notation);
  const first = hy.validate('w*3+7');
  for (let i = 0; i < 5; i++) hy.validate('w*3+7');
  eq('validate 缓存后结果稳定', hy.validate('w*3+7'), first);
  eq('validate 非法串缓存后仍为 false', hy.validate('zzz'), false);
}

console.log('\n' + (failures === 0 ? '全部通过 ✅' : `${failures} 项失败 ❌`));
process.exit(failures === 0 ? 0 : 1);

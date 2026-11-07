/**
 * 记号插件回归测试：固化 2026-11-07 的实现修正。
 *
 * 分两类断言：
 *   A. 修正项 —— fsLimit 0-based / 两位数解析 / 零与后继的协议短路 / 死循环护栏 /
 *      零表达式 typeOf / 9·99 解析步进；
 *   B. 契约锁定 —— 展开规则与 fs(n) 的块数偏移**保持不变**，防止修正输入层时
 *      误伤数学语义或与序数尺 / 展开树组合出问题（见 docs/IMPLEMENTATION-NOTES.md）。
 *
 * 跑法：npm run verify:notations
 */

import { NOTATIONS as P } from '../src/notations/index';
import { engine } from '../src/engine/host';

let pass = 0;
let fail = 0;
function eq(label, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${label.padEnd(62)} ${JSON.stringify(actual)}${ok ? '' : ' ≠ ' + JSON.stringify(expected)}`);
}
function ok(label, cond, detail = '') {
  cond ? pass++ : fail++;
  console.log(`${cond ? '  ok  ' : ' FAIL '} ${label.padEnd(62)} ${detail}`);
}
function section(name) {
  console.log('\n── ' + name + ' ' + '─'.repeat(Math.max(0, 46 - name.length)));
}

// ════════════════════════════════════════════════
section('A1. fsLimit 统一为 0-based（第 0 项必须是极限表达式）');
eq('zero_y            fsLimit(0)', P.zero_y.fsLimit(0), '1,2');
eq('zero_y            fsLimit(1)', P.zero_y.fsLimit(1), '1,3');
eq('coprime           fsLimit(0)', P.coprime.fsLimit(0), '1,2');
eq('residue_class     fsLimit(0)', P.residue_class.fsLimit(0), '1,2');
eq('simplified_minus2y fsLimit(0)', P.simplified_minus2y.fsLimit(0), '1,2');
eq('lprss             fsLimit(0)', P.lprss.fsLimit(0), '1,2');
eq('bashicu_matrix    fsLimit(0)', P.bashicu_matrix.fsLimit(0), '(0)(1)');
eq('bashicu_matrix    fsLimit(1)', P.bashicu_matrix.fsLimit(1), '(0,0)(1,1)');
eq('parented_bms      fsLimit(0)', P.parented_bms.fsLimit(0), '(0)(1)');
eq('ppm00t            fsLimit(0)', P.ppm00t.fsLimit(0), '(0)(0)(2)');
eq('kp_hydra          fsLimit(0)', P.kp_hydra.fsLimit(0), '(())');
eq('pss_hydra         fsLimit(0)', P.pss_hydra.fsLimit(0), '0(1())');
eq('pps4              fsLimit(0)', P.pps4.fsLimit(0), '0,1');
eq('stos              fsLimit(0)', P.stos.fsLimit(0), '1,w');
eq('remainder_retention fsLimit(0)', P.remainder_retention.fsLimit(0), '1 2');

const limitIds = Object.keys(P).filter((id) => id !== 'lels');
ok('除 LELS 外，fsLimit(0) 全部被判为极限序数',
  limitIds.every((id) => P[id].typeOf(P[id].fsLimit(0)) === '3'),
  `检查 ${limitIds.length} 个记号`);

// ════════════════════════════════════════════════
section('A2. 两位数解析（txma 按实际元素个数推断列数）');
const two = '(0,0)(10,11,12)';
eq('bashicu_matrix  typeOf 两位数值', P.bashicu_matrix.typeOf(two), '3');
eq('bashicu_matrix  pred 两位数值', P.bashicu_matrix.pred(two), '(0,0,0)');
eq('parented_bms    pred 两位数值', P.parented_bms.pred(two), '(0,0,0)');
eq('报告 §2.8 三行用例（原版错给 5 列）',
  P.bashicu_matrix.pred('(0,0,0)(10,11,12)(20,21,22)'), '(0,0,0)(10,11,12)');
eq('单位数输入行为不变', P.bashicu_matrix.pred('(0,0)(1,1)'), '(0,0)');
eq('空矩阵 pred 按协议返回 "0"', P.bashicu_matrix.pred(''), '0');

// ════════════════════════════════════════════════
section('A3. 零表达式 typeOf / pred（ONP2 协议）');
for (const id of ['zero_y', 'coprime', 'residue_class', 'lprss', 'kp_hydra',
  'pss_hydra', 'bashicu_matrix', 'ppm', 'pps2', 'remainder_retention', 'stos', 'mfss']) {
  eq(`typeOf("0") [${id}]`, P[id].typeOf('0'), '1');
}
for (const id of ['zero_y', 'lprss', 'kp_hydra', 'pss_hydra', 'bashicu_matrix',
  'ppm', 'pps2', 'coprime', 'residue_class', 'remainder_retention']) {
  eq(`pred("0") [${id}]`, P[id].pred('0'), '0');
}
eq('lprss     pred("")', P.lprss.pred(''), '0');
eq('kp_hydra  pred("")', P.kp_hydra.pred(''), '0');
eq('pss_hydra pred("")', P.pss_hydra.pred(''), '0');

// ════════════════════════════════════════════════
section('A4. 零 / 后继的 fs 短路（不产生负数、空串、不平衡括号）');
eq('RCS         fs(1,"0")  不再产生负数', P.residue_class.fs(1, '0'), '0');
eq('RCS         fs(2,"0")', P.residue_class.fs(2, '0'), '0');
eq('CpS         fs(1,"0")', P.coprime.fs(1, '0'), '0');
eq('KP Hydra    fs(0,"()") 不再输出 ")"', P.kp_hydra.fs(0, '()'), '()');
eq('KP Hydra    fs(1,"()")', P.kp_hydra.fs(1, '()'), '()');
eq('PSS Hydra   fs(1,"0()")', P.pss_hydra.fs(1, '0()'), '0()');
eq('bashicu_matrix fs(1,"(0)(0)") 无坏根不复制', P.bashicu_matrix.fs(1, '(0)(0)'), '(0)(0)');
ok('后继表达式 fs 不再输出以 ")" 开头的非法串',
  !P.kp_hydra.fs(1, '()').startsWith(')'));

// ════════════════════════════════════════════════
section('A5. 死循环 / 栈溢出护栏（全部要求同步返回）');
const hangCases = [
  ['coprime', '0,2,4'], ['coprime', '2,4,8'], ['coprime', '0,2'], ['coprime', '0,2,6'],
  ['residue_class', '0,2,4'], ['residue_class', '2,4,8'],
  ['lels', '(0)'], ['lels', '(0)(0)'], ['lels', '(0,0)(0,0)'], ['lels', ''], ['lels', 'abc'],
  ['zero_y', '1,-1'], ['zero_y', '1,2,π'],
  ['kp_hydra', '()'], ['kp_hydra', '0'],
  ['pss_hydra', '0()'], ['pss_hydra', '0'],
];
for (const [id, s] of hangCases) {
  let v;
  try { v = P[id].fs(1, s); } catch (e) { v = 'ERR ' + String(e.message || e).slice(0, 60); }
  ok(`fs(1, ${JSON.stringify(s)}) [${id}] 返回字符串`, typeof v === 'string' && !v.startsWith('ERR'), JSON.stringify(v).slice(0, 42));
}

// ════════════════════════════════════════════════
section('A6. bias=1 的 9 / 99 解析步进（上游 commit 72d5154 的修复）');
ok('pps4 fs(1,"9,1") 不再把后续元素吞掉', P.pps4.fs(1, '9,1').startsWith('9'), P.pps4.fs(1, '9,1'));
ok('mfss fs(1,"9,1,2")', P.mfss.fs(1, '9,1,2').startsWith('9'), P.mfss.fs(1, '9,1,2'));

// ════════════════════════════════════════════════
section('B. 契约锁定：展开规则与 fs(n) 块数偏移保持不变');
// 0-Y：Wiki 基准 (1,4,6,4) 的展开序列
eq('0-Y (1,4,6,4) fs(3) = Wiki 展开前缀',
  P.zero_y.fs(3, '1,4,6,4'), '1,4,6,3,7,10,6,11,15,10,16,21');
// LPrSS：Wiki (1,4,6,6)
eq('LPrSS (1,4,6,6) fs(3)', P.lprss.fs(3, '1,4,6,6'), '1,4,6,5,7,6,8,7,9');
// 以下期望值全部取自**修正前的原版实测**，用来锁定「展开规则一字未动」。
// 详见 docs/IMPLEMENTATION-NOTES.md §2：块数偏移是复原 exe 口径，不是 bug。
eq('0-Y (1,4,6,4) fs(3) = Wiki 展开前缀',
  P.zero_y.fs(3, '1,4,6,4'), '1,4,6,3,7,10,6,11,15,10,16,21');
eq('LPrSS (1,4,6,6) fs(3)', P.lprss.fs(3, '1,4,6,6'), '1,4,6,5,7,6,8,7,9');
eq('BMS 4 行含两位数的二次展开',
  P.bashicu_matrix.fs(2, '(0,0,0,0)(1,1,1,1)(2,2,2,1)(3,3,1,1)(4,2,0,0)(5,1,1,1)(6,2,2,1)'),
  '(0,0,0,0)(1,1,1,1)(2,2,2,1)(3,3,1,1)(4,2,0,0)(5,1,1,1)(6,2,2,0)(7,3,3,1)(8,4,4,1)(9,5,3,1)(10,4,0,0)(11,3,3,1)(12,4,4,0)(13,5,5,1)(14,6,6,1)(15,7,5,1)(16,6,0,0)(17,5,5,1)');
eq('BMS       fs(1,"(0)(1)")', P.bashicu_matrix.fs(1, '(0)(1)'), '(0)(0)');
eq('KP Hydra  fs(1,"(())")', P.kp_hydra.fs(1, '(())'), '()()');
eq('PSS Hydra fs(1,"0(1())")', P.pss_hydra.fs(1, '0(1())'), '0(0())');
eq('pps2      fs(1,"0,1")', P.pps2.fs(1, '0,1'), '0,0');
eq('pps4      fs(1,"0,1")', P.pps4.fs(1, '0,1'), '0,1');
eq('coprime   fs(1,"1,3,5,7")', P.coprime.fs(1, '1,3,5,7'), '1,3,5,6');
eq('residue_class fs(1,"1,3,5,7,9")', P.residue_class.fs(1, '1,3,5,7,9'), '1,3,5,7,8,9,11,13,15');
eq('LELS      fs(1,"(0,0)(0,1)") 按原作者源码复原', P.lels.fs(1, '(0,0)(0,1)'), '(0)(1)');

// ════════════════════════════════════════════════
section('C. 宿主组合：序数尺 firstExceeding 在 31 个记号上不抛错');
let rulerBad = [];
for (const [id, p] of Object.entries(P)) {
  try {
    engine.load(p);
    const fe = engine.firstExceeding('0', 'Limit');
    if (!fe.expr || typeof fe.expr !== 'string') rulerBad.push(id);
  } catch (e) { rulerBad.push(`${id}:${String(e.message || e).slice(0, 30)}`); }
}
ok('31 个记号 firstExceeding("0","Limit") 全部可用', rulerBad.length === 0, rulerBad.join(','));

console.log(`\n${'='.repeat(72)}`);
console.log(`通过 ${pass} / ${pass + fail}${fail ? `，失败 ${fail}` : '  ✅ 全部通过'}`);
if (fail) process.exitCode = 1;

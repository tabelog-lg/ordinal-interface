/**
 * 集成实验 2：问题定位。
 *
 * 实验 1 发现 21/30 的序数尺根节点退化成最小有限数。这里查根因：
 * 看每个记号的「命令 1（Limit 的基本列）」到底给的是什么。
 */

import { engine } from '../src/engine/host';
import { NOTATIONS } from '../src/notations/index';

const rows = [];
for (const [id, p] of Object.entries(NOTATIONS)) {
  engine.load(p);
  const fs = [0, 1, 2, 3, 4, 5].map((n) => p.fsLimit(n));
  const distinct = new Set(fs).size;
  // 基本列是否严格递增
  let mono = true;
  for (let i = 1; i < fs.length; i++) if (!p.less(fs[i - 1], fs[i])) mono = false;
  rows.push({ id, distinct, mono, fs });
}

const w = (s, n) => String(s).padEnd(n);
console.log(w('id', 27) + w('不同项', 7) + w('递增', 6) + 'fsLimit(0..5)');
console.log('-'.repeat(110));
for (const r of rows) {
  console.log(w(r.id, 27) + w(r.distinct + '/6', 7) + w(r.mono ? 'yes' : 'NO', 6) + r.fs.map((s) => JSON.stringify(s)).join(' '));
}
console.log('-'.repeat(110));
const flat = rows.filter((r) => r.distinct <= 1);
console.log(`命令 1 输出恒定（基本列是常数）的：${flat.length} 个 -> ${flat.map((r) => r.id).join(', ')}`);
const nonmono = rows.filter((r) => !r.mono);
console.log(`基本列非严格递增的：${nonmono.length} 个 -> ${nonmono.map((r) => r.id).join(', ')}`);

// 对照：仓库自带的内置记号
console.log('\n对照 —— 仓库自带的两个内置记号：');
for (const [n, mod] of [
  ['omega2', await import('../src/engine/omega2')],
  ['omegaOmega', await import('../src/engine/omegaOmega')],
]) {
  const p = mod[n === 'omega2' ? 'omega2Notation' : 'omegaOmegaNotation'];
  engine.load(p);
  const fs = [0, 1, 2, 3, 4, 5].map((x) => p.fsLimit(x));
  let mono = true;
  for (let i = 1; i < fs.length; i++) if (!p.less(fs[i - 1], fs[i])) mono = false;
  console.log(`  ${w(n, 14)} 不同项 ${new Set(fs).size}/6  递增 ${mono ? 'yes' : 'NO'}  ${fs.map((s) => JSON.stringify(s)).join(' ')}`);
}

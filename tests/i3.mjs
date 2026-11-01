import { engine } from '../src/engine/host';
import { NOTATIONS } from '../src/notations/index';
// 命令 1 恒定的 6 个 + mfss：看给定具体表达式后，展开树那套（fs + firstExceeding）能不能跑
const cases = {
  zero_y: ['1,2', '1,2,3', '1,3'],
  zero_y_super_non_lifting: ['1,2', '1,2,3', '1,3'],
  simplified_minus2y: ['1,2', '1,2,2'],
  coprime: ['1,2', '1,2,3', '2,3'],
  residue_class: ['1,2', '1,2,3', '2,3'],
  remainder_retention: ['1 2', '1 2 3', '1 3'],
  mfss: ['0,1,2', '0,1,2,3'],
};
for (const [id, exprs] of Object.entries(cases)) {
  const p = NOTATIONS[id];
  engine.load(p);
  for (const e of exprs) {
    const t = engine.queryType(e);
    const fs = [0,1,2,3].map(n => engine.getFSTerm(n, e));
    let mono = true;
    for (let i=1;i<fs.length;i++) if (!engine.isLessThan(fs[i-1], fs[i])) mono = false;
    let fe = '-';
    try { fe = JSON.stringify(engine.firstExceeding('0', e)); } catch (err) { fe = 'ERR ' + err.message.slice(0,40); }
    console.log(`${id.padEnd(26)} ${e.padEnd(8)} type=${t} 递增=${mono?'yes':'NO '} fs=${fs.map(s=>JSON.stringify(s)).join(' ')}`);
  }
}

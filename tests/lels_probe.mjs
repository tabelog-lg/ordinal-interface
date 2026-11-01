import { engine } from '../src/engine/host';
import { NOTATIONS } from '../src/notations/index';
const p = NOTATIONS.lels;
engine.load(p);
const target = '(0,0,0)(0,0,1)';
console.log('typeOf(target) =', engine.queryType(target));
console.log('validate(target) =', engine.validate(target));
console.log('\n--- fsLimit ---');
for (let n=0;n<4;n++) console.log(' ', n, JSON.stringify(p.fsLimit(n)));
console.log('\n--- fs(target) ---');
for (let n=0;n<4;n++) console.log(' ', n, JSON.stringify(p.fs(n,target)));
console.log('\n--- less 关系 ---');
const cands = ['(0)','(0)(1)','(0,0)(0,1)','(0,0,0)(0,0,1)'];
for (const c of cands) {
  console.log('  target <', c, '?', engine.isLessThan(target, c), ' | ', c, '< target ?', engine.isLessThan(c, target));
}

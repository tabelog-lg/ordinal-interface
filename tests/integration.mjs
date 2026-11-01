/**
 * 集成实验：把 30 个记号塞进 ordinal-interface，看宿主（EngineHost）
 * 和序数尺 / 展开树在他们身上跑得动跑不动。
 *
 * 跑法：node tests/integration.mjs
 */

import { engine } from '../src/engine/host';
import { RulerEngine } from '../src/core/ruler';
import { TreeEngine } from '../src/core/tree';
import { NOTATIONS } from '../src/notations/index';

const nullPainter = () => ({
  clear: () => {},
  drawCenter: () => {},
  drawTick: () => {},
});

const rows = [];
for (const [id, p] of Object.entries(NOTATIONS)) {
  const r = { id, name: p.name, fe: '', rootType: '', ruler: '', tree: '', validate: '' };

  try {
    engine.load(p);
    // 1) 序数尺初始化（最苛刻：firstExceeding + 单调性抽查）
    const ruler = new RulerEngine();
    ruler.height = 800;
    ruler.tickLength = 200;
    ruler.fontHeight = 32;
    ruler.textHalfHeight = 16;
    ruler.denseTickLimit = 65;
    ruler.init();
    const fe = engine.firstExceeding('0', 'Limit');
    r.fe = `index=${fe.index} expr=${JSON.stringify(fe.expr)}`;
    r.rootType = engine.queryType(ruler.rootNode.expression ?? '');
    ruler.draw(nullPainter(), false);
    r.ruler = 'ok';
  } catch (e) {
    r.ruler = 'ERR ' + (e instanceof Error ? e.message.slice(0, 60) : e);
  }

  try {
    // 2) 展开树初始化
    const tree = new TreeEngine();
    tree.init();
    r.tree = `rows=${tree.visibleRows().length}`;
  } catch (e) {
    r.tree = 'ERR ' + (e instanceof Error ? e.message.slice(0, 60) : e);
  }

  try {
    // 3) validate：拿 fsLimit 产出的串去校验（应当合法）
    const samples = [0, 1, 2, 3].map((n) => p.fsLimit(n)).filter((s) => s && s !== '0');
    const bad = samples.filter((s) => !engine.validate(s));
    r.validate = bad.length ? `非法 ${bad.length}/${samples.length}` : `ok ${samples.length}`;
  } catch (e) {
    r.validate = 'ERR ' + (e instanceof Error ? e.message.slice(0, 60) : e);
  }

  rows.push(r);
}

const w = (s, n) => String(s).padEnd(n);
console.log(w('id', 27) + w('rootType', 9) + w('ruler', 8) + w('tree', 9) + w('validate', 10) + 'firstExceeding');
console.log('-'.repeat(100));
for (const r of rows) {
  console.log(w(r.id, 27) + w(r.rootType, 9) + w(r.ruler, 8) + w(r.tree, 9) + w(r.validate, 10) + r.fe);
}
const errs = rows.filter((r) => r.ruler.startsWith('ERR') || r.tree.startsWith('ERR'));
console.log('-'.repeat(100));
console.log(`记号 ${rows.length} 个，初始化失败 ${errs.length} 个`);
const nonLimit = rows.filter((r) => r.rootType !== '3');
console.log(`根节点不是极限序数（typeOf != '3'）的有 ${nonLimit.length} 个：` + nonLimit.map((r) => r.id).join(', '));

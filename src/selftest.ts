/**
 * 浏览器内自检（开发工具，不参与主应用打包）：
 * 验证 canvas 真的画出了像素、点击展开树真的插入了行、滚轮真的改变了视窗。
 * 用 `npm run dev` 起服务后打开 /selftest.html，结果直接打印在页面上。
 */

import { omega2Notation } from './engine/omega2';
import { engine } from './engine/host';
import { RulerEngine } from './core/ruler';
import { TreeEngine } from './core/tree';
import { RulerView } from './ui/rulerView';
import { TreeView } from './ui/treeView';
import { settings } from './core/state';

const out: string[] = [];
const log = (s: string): void => void out.push(s);
let failures = 0;
const check = (label: string, cond: boolean, extra = ''): void => {
  if (!cond) failures++;
  log(`${cond ? '  ok  ' : ' FAIL '} ${label}${extra ? '  —— ' + extra : ''}`);
};

/** 统计画布上"非背景色"的像素数，用来确认真的画了东西 */
function nonBgPixels(c: HTMLCanvasElement): number {
  const ctx = c.getContext('2d')!;
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  const bg = settings.bgColor;
  const br = parseInt(bg.slice(1, 3), 16);
  const bg_ = parseInt(bg.slice(3, 5), 16);
  const bb = parseInt(bg.slice(5, 7), 16);
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (
      Math.abs(data[i] - br) > 30 ||
      Math.abs(data[i + 1] - bg_) > 30 ||
      Math.abs(data[i + 2] - bb) > 30
    ) {
      n++;
    }
  }
  return n;
}

try {
  engine.load(omega2Notation);
  check('引擎装载', engine.ready, engine.name);

  const ruler = new RulerEngine();
  const tree = new TreeEngine();
  ruler.init();
  tree.init();
  check('序数尺初始化', ruler.rootNode.expression === 'w', String(ruler.rootNode.expression));
  check('展开树初始化', tree.tree.first?.value.expression === 'Limit');

  const rc = document.getElementById('c1') as HTMLCanvasElement;
  const tc = document.getElementById('c2') as HTMLCanvasElement;
  log(`canvas 尺寸: ruler ${rc.width}x${rc.height}  tree ${tc.width}x${tc.height}`);

  const rv = new RulerView(ruler, rc);
  const tv = new TreeView(tree, tc);
  rv.redraw();
  tv.redraw();

  const rp = nonBgPixels(rc);
  const tp = nonBgPixels(tc);
  check('序数尺画出了像素', rp > 100, `${rp} px`);
  check('展开树画出了像素', tp > 100, `${tp} px`);

  // ——— 展开树：点击第一行两次，验证 bug 1 的修复
  const rowH = 43;
  const first = tree.click(10, rowH, false);
  check('点击第一行插入成功', first);
  tv.redraw();
  check('展开树像素变多', nonBgPixels(tc) >= tp);
  const exprAfter1 = tree.tree.first?.next?.value.expression;
  check('第一次点击插入 w', exprAfter1 === 'w', String(exprAfter1));

  tree.click(10, rowH, false);
  const exprAfter2 = tree.tree.first?.next?.value.expression;
  check('第二次点击插入 w*2（bug 1 修复点）', exprAfter2 === 'w*2', String(exprAfter2));

  // ——— 序数尺：滚轮
  const before = ruler.viewSpan;
  ruler.wheel(false, 0);
  rv.redraw();
  check('滚轮改变了视窗', ruler.viewSpan !== before || ruler.lowerNode.expression !== '1',
    `span ${before.toFixed(4)} → ${ruler.viewSpan.toFixed(4)}, lower=${ruler.lowerNode.expression}`);
  check('滚轮后仍画出像素', nonBgPixels(rc) > 100, `${nonBgPixels(rc)} px`);

  for (let i = 0; i < 30; i++) ruler.wheel(true, -20);
  rv.redraw();
  check('连续拉远 30 次后仍画出像素', nonBgPixels(rc) > 100, `${nonBgPixels(rc)} px`);

  log('');
  log(failures === 0 ? '全部通过 ✅' : `${failures} 项失败 ❌`);
} catch (err) {
  failures++;
  log('抛异常: ' + (err as Error).message);
  log((err as Error).stack ?? '');
}

const el = document.getElementById('out')!;
el.textContent = out.join('\n');
document.title = failures === 0 ? 'SELFTEST-PASS' : 'SELFTEST-FAIL';

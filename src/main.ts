/**
 * 序数界面1 v1.5.4 —— 网页版入口。
 *
 * 结构照搬原程序：五个页签（选择序数记号 / 杂项 / 展开树 / 序数尺 / 设置），
 * 主程序本身不做任何序数运算，全部交给 ONP2 记号插件。
 */

import './style.css';

import { TreeEngine } from './core/tree';
import { RulerEngine } from './core/ruler';
import { engine } from './engine/host';
import { instantiate, restorePlugins, type PluginEntry } from './engine/plugins';
import { loadSettings, saveSettings } from './core/state';
import { createRulerView } from './ui/rulerView';
import { createTreeView } from './ui/treeView';
import { clearMiscResults, initMisc, setMiscEnabled } from './ui/misc';
import { initSettings } from './ui/settings';
import { initPlugins, initialEntry } from './ui/plugins';
import { $, toast } from './ui/dom';

async function main(): Promise<void> {
  loadSettings();
  await restorePlugins();

  const ruler = new RulerEngine();
  const tree = new TreeEngine();
  const rulerView = createRulerView(ruler);
  const treeView = createTreeView(tree);

  /** 两个画布一起重绘（原 Sub12） */
  const redrawAll = (): void => {
    rulerView.redraw();
    treeView.redraw();
  };

  initMisc();
  initSettings(redrawAll);

  /** 选中一个记号系统：装载引擎，重建序数尺与展开树 */
  const selectNotation = async (entry: PluginEntry): Promise<void> => {
    try {
      const plugin = await instantiate(entry);
      engine.load(plugin);
      $('engine-name').textContent = plugin.name;

      clearMiscResults();
      tree.init();
      ruler.init();
      setMiscEnabled(true);
      redrawAll();
    } catch (err) {
      engine.load(null);
      setMiscEnabled(false);
      $('engine-name').textContent = '（未装载）';
      toast('装载失败：' + (err as Error).message);
    }
  };

  initPlugins((entry) => void selectNotation(entry));

  // —— 页签切换
  const showPage = (name: string): void => {
    for (const t of document.querySelectorAll<HTMLButtonElement>('#tabs .tab')) {
      t.classList.toggle('active', t.dataset.tab === name);
    }
    for (const p of document.querySelectorAll<HTMLElement>('.page')) {
      p.classList.toggle('active', p.id === 'page-' + name);
    }
    if (name === 'ruler') rulerView.redraw();
    if (name === 'tree') treeView.redraw();
  };

  for (const t of document.querySelectorAll<HTMLButtonElement>('#tabs .tab')) {
    t.addEventListener('click', () => showPage(t.dataset.tab!));
  }
  // 支持用 #ruler / #tree 之类的锚点直接打开某个页签
  const initial = location.hash.replace('#', '');
  showPage(['notation', 'misc', 'tree', 'ruler', 'settings'].includes(initial) ? initial : 'notation');

  // —— 装载上次选用的记号（找不到就退回内置的 Omega2）
  const entry = initialEntry();
  if (entry) await selectNotation(entry);

  // 窗口尺寸变化时重排画布
  window.addEventListener('resize', redrawAll);
  saveSettings();
}

void main();

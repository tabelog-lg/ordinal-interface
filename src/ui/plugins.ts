/**
 * 选择序数记号页（TabPage5）。
 *
 * 对应原程序的 ListBox1 + 「添加序数记号位置」/「删除序数记号位置」。
 * OpenFileDialog 挑 exe 改成 <input type="file"> 挑 .js —— 网页版执行不了 exe，
 * 插件形态换成自包含的 ES module。
 */

import {
  addPluginFromFile,
  listPlugins,
  removePlugin,
  type PluginEntry,
} from '../engine/plugins';
import { settings, saveSettings } from '../core/state';
import { $, toast } from './dom';

/** 插件模板：一个最小可用的 ONP2 记号插件骨架 */
const PLUGIN_TEMPLATE = `// ONP2 记号插件模板 —— 自包含的 ES module，默认导出插件对象。
// 五个方法对应协议命令 1~5，必须是纯函数（宿主会缓存结果）。
export default {
  name: 'My Notation',

  // 命令 1：最大序数 Limit 的基本列第 a 项
  fsLimit(a) { return String(a); },

  // 命令 2：序数类型 —— "1"=0 / "2"=后继序数 / "3"=极限序数
  typeOf(a) { return a === '0' ? '1' : '2'; },

  // 命令 3：前继序数（极限序数与 0 返回 "0" 兜底）
  pred(a) { return '0'; },

  // 命令 4：序数 b 的基本列第 a 项
  fs(a, b) { return String(a); },

  // 命令 5：a < b ?
  less(a, b) { return false; },
};
`;

export function initPlugins(onSelect: (entry: PluginEntry) => void): void {
  const list = $<HTMLUListElement>('plugin-list');
  const fileInput = $<HTMLInputElement>('file-plugin');

  const render = (): void => {
    list.innerHTML = '';
    for (const entry of listPlugins()) {
      const li = document.createElement('li');
      li.textContent = entry.name;
      if (entry.id === settings.lastPluginId) li.classList.add('selected');

      const tag = document.createElement('span');
      tag.className = entry.builtin ? 'builtin' : 'tag';
      tag.textContent = entry.builtin ? '内置' : '用户上传';
      li.appendChild(tag);

      li.addEventListener('click', () => {
        settings.lastPluginId = entry.id;
        saveSettings();
        render();
        onSelect(entry);
      });
      list.appendChild(li);
    }
  };

  // 添加序数记号位置
  $('btn-add').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    try {
      const entry = await addPluginFromFile(file);
      render();
      toast(`已添加记号「${entry.name}」，点它即可启用`);
    } catch (err) {
      toast((err as Error).message);
    }
  });

  // 删除序数记号位置
  $('btn-del').addEventListener('click', async () => {
    const entry = listPlugins().find((e) => e.id === settings.lastPluginId);
    if (!entry) {
      toast('请先在列表里选中一个记号');
      return;
    }
    try {
      await removePlugin(entry);
      settings.lastPluginId = null;
      saveSettings();
      render();
      toast(`已删除记号「${entry.name}」`);
    } catch (err) {
      toast((err as Error).message);
    }
  });

  // 下载插件模板
  $('btn-demo').addEventListener('click', () => {
    const blob = new Blob([PLUGIN_TEMPLATE], { type: 'text/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'onp2-plugin-template.js';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  render();
}

/** 启动时装载上次选用的记号；找不到就退回内置 */
export function initialEntry(): PluginEntry | null {
  const all = listPlugins();
  return all.find((e) => e.id === settings.lastPluginId) ?? all[0] ?? null;
}

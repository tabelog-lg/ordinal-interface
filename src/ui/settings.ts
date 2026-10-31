/**
 * 设置页（TabPage4）。
 *
 * 原程序里 CheckBox / RadioButton 的统一行为是「勾上变绿、取消变红」（原 Sub5），
 * 这里用 CSS 的 [aria-pressed] 实现；ColorDialog 换成 <input type="color">。
 */

import {
  settings,
  saveSettings,
  exportConfig,
  importConfig,
  ALIGN_ORDER,
  type AlignMode,
} from '../core/state';
import { $, toast } from './dom';

/** 让控件显示当前 settings 的值 */
export function syncSettingsControls(): void {
  $('cb4').setAttribute('aria-pressed', String(settings.continuous));
  $('cb1').setAttribute('aria-pressed', String(settings.denseTicks));

  for (const btn of document.querySelectorAll<HTMLButtonElement>('#align-group .seg-btn')) {
    const mode = btn.dataset.align as AlignMode;
    btn.setAttribute('aria-pressed', String(mode === settings.alignMode));
  }

  $<HTMLInputElement>('btn1').value = settings.normalColor;
  $<HTMLInputElement>('btn5').value = settings.limitColor;
  $<HTMLInputElement>('btn6').value = settings.bgColor;
}

/**
 * @param onChange 需要重绘画布时回调（颜色 / 对齐模式 / 密集刻度变化）
 */
export function initSettings(onChange: () => void): void {
  syncSettingsControls();

  const persist = (): void => {
    saveSettings();
    syncSettingsControls();
  };

  // 展开树连续展开 —— 只影响后续点击行为，不需要重绘
  $('cb4').addEventListener('click', () => {
    settings.continuous = !settings.continuous;
    persist();
  });

  // 序数尺密集刻度 —— 需要重绘序数尺
  $('cb1').addEventListener('click', () => {
    settings.denseTicks = !settings.denseTicks;
    persist();
    onChange();
  });

  // 展开树的对齐模式
  for (const btn of document.querySelectorAll<HTMLButtonElement>('#align-group .seg-btn')) {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.align as AlignMode;
      if (!ALIGN_ORDER.includes(mode) || mode === settings.alignMode) return;
      settings.alignMode = mode;
      persist();
      onChange();
    });
  }

  // 三个颜色按钮
  const bindColor = (id: string, key: 'normalColor' | 'limitColor' | 'bgColor'): void => {
    $<HTMLInputElement>(id).addEventListener('input', (e) => {
      settings[key] = (e.target as HTMLInputElement).value;
      persist();
      onChange();
    });
  };
  bindColor('btn1', 'normalColor');
  bindColor('btn5', 'limitColor');
  bindColor('btn6', 'bgColor');

  // 配置的导出 / 导入
  $('btn-export').addEventListener('click', () => {
    const blob = new Blob([exportConfig()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ordinal-interface-config.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  const fileInput = $<HTMLInputElement>('file-config');
  $('btn-import').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    try {
      const { restoredPaths } = importConfig(await file.text());
      saveSettings();
      syncSettingsControls();
      onChange();
      toast(restoredPaths ? '配置已导入' : '配置已导入（旧版配置里的插件路径无法复原，已跳过）');
    } catch (err) {
      toast('导入失败：' + (err as Error).message);
    }
  });
}

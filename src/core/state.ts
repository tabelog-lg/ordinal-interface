/**
 * 全局应用状态 + 配置持久化。
 *
 * 原程序把配置写在**启动目录下的隐藏文件「1」**里（VB 的 FileSystem.Print/Input，
 * 版本号 6，格式见《ONP2协议与还原说明.md》第八节）。网页版拿不到"启动目录"，
 * 改用 localStorage + JSON。
 *
 * 另外：原配置里存的是插件 exe 的**绝对路径**，浏览器拿不到真实路径也执行不了 exe，
 * 所以这里改存"插件 id"，用户上传的插件源码另存 IndexedDB —— 这是网页版唯一能
 * 真正复原的持久化方式。为兼容旧档，importConfig() 仍能读旧版文件的颜色与开关。
 */

export type AlignMode = 'all' | 'fs' | 'continuous' | 'hypcos';

/** 与旧版配置文件里的数字一一对应 */
export const ALIGN_ORDER: AlignMode[] = ['all', 'fs', 'continuous', 'hypcos'];

export interface Settings {
  /** 展开树的对齐模式 */
  alignMode: AlignMode;
  /** 展开树连续展开（CheckBox4，默认勾上） */
  continuous: boolean;
  /** 序数尺密集刻度（CheckBox1，默认不勾） */
  denseTicks: boolean;
  /** 0 和后继序数的文本颜色（Button1） */
  normalColor: string;
  /** 极限序数的文本颜色（Button5） */
  limitColor: string;
  /** 展开树和序数尺的背景颜色（Button6） */
  bgColor: string;
  /** 上次选用的记号插件 id */
  lastPluginId: string | null;
}

const STORAGE_KEY = 'ordinal-interface:settings:v1';

/** 原程序 PictureBox 的默认底色（SystemColors.Control 附近） */
const DEFAULT_BG = '#f0f0f0';

export function defaultSettings(): Settings {
  return {
    alignMode: 'hypcos', // RadioButton6 "Hyp Cos" 是设计器里的默认选中项
    continuous: true, // CheckBox4 默认 Checked
    denseTicks: false,
    normalColor: '#ff0000', // Button1.BackColor = Red
    limitColor: '#00ff00', // Button5.BackColor = Lime
    bgColor: DEFAULT_BG,
    lastPluginId: null,
  };
}

export let settings: Settings = defaultSettings();

type Listener = () => void;
const listeners: Listener[] = [];

export function onSettingsChange(fn: Listener): void {
  listeners.push(fn);
}

export function notifySettingsChanged(): void {
  for (const fn of listeners) fn();
}

// ————————————————————————————————————————————————
//  读写
// ————————————————————————————————————————————————

export function loadSettings(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    settings = { ...defaultSettings(), ...parsed };
    if (!ALIGN_ORDER.includes(settings.alignMode)) settings.alignMode = 'hypcos';
  } catch {
    settings = defaultSettings();
  }
}

export function saveSettings(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* 隐私模式下写不进去，忽略 */
  }
}

/** 导出为 JSON（网页版自己的格式） */
export function exportConfig(): string {
  return JSON.stringify({ version: 6, format: 'ordinal-interface-web', ...settings }, null, 2);
}

/**
 * 导入配置。自动识别是网页版 JSON 还是原程序的旧版配置文件。
 * 旧版文件里的插件路径无法复原，只恢复颜色 / 对齐模式 / 两个开关。
 */
export function importConfig(text: string): { restoredPaths: boolean } {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed) as Partial<Settings>;
    settings = { ...defaultSettings(), ...parsed };
    if (!ALIGN_ORDER.includes(settings.alignMode)) settings.alignMode = 'hypcos';
    return { restoredPaths: false };
  }
  return importLegacyConfig(trimmed);
}

/**
 * 解析旧版配置文件（隐藏文件「1」）：
 *   版本号 / n-1 / 路径×n / 名称×n / RGB×3 / 对齐模式 / 连续展开 / 密集刻度
 * VB 的 FileSystem.Print 每个数值写一行，所以整份文件就是"每行一个字段"。
 */
function importLegacyConfig(text: string): { restoredPaths: boolean } {
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (lines.length < 3 || lines[0] !== '6') {
    throw new Error('不像旧版配置文件（首行应为版本号 6）');
  }

  const n = parseInt(lines[1], 10) + 1;
  if (!Number.isFinite(n) || n < 1 || n > 1000) throw new Error('记号个数解析失败');

  let p = 2 + n; // 跳过路径
  p += n; // 跳过名称
  const rgb: number[] = [];
  for (let i = 0; i < 9; i++) {
    const v = parseInt(lines[p++] ?? '', 10);
    rgb.push(Number.isFinite(v) ? clamp255(v) : 0);
  }
  const align = parseInt(lines[p++] ?? '', 10);
  const continuous = (lines[p++] ?? '') === 'True';
  const dense = (lines[p++] ?? '') === 'True';

  settings = {
    ...settings,
    normalColor: rgbToHex(rgb[0], rgb[1], rgb[2]),
    limitColor: rgbToHex(rgb[3], rgb[4], rgb[5]),
    bgColor: rgbToHex(rgb[6], rgb[7], rgb[8]),
    alignMode: ALIGN_ORDER[align - 1] ?? 'hypcos',
    continuous,
    denseTicks: dense,
  };
  return { restoredPaths: false };
}

function clamp255(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (v: number) => clamp255(v).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}

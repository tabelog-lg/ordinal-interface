/**
 * 记号插件仓库。
 *
 * 原程序里插件是"磁盘上一个 exe 的绝对路径"，网页版拿不到真实路径也没法执行 exe，
 * 于是插件形态换成 **JS 模块**：一个自包含的 ES module，默认导出 ONP2Plugin 对象
 * （或返回它的工厂函数）。见 public/plugins/omega2-example.js。
 *
 * 内置记号用 **BUILTINS 注册表**声明（见下），新增一个内置记号只需要往数组里加一行。
 * 用户上传的插件源码存 IndexedDB，刷新后仍在 —— 原程序的"记住 exe 路径"在这里由
 * "记住插件源码"替代，这也是网页版唯一能真正复原的持久化方式。
 */

import { resolvePlugin, type ONP2Plugin } from './types';

export interface PluginEntry {
  /** 'builtin:<key>' 或 'user:<timestamp>' */
  id: string;
  name: string;
  builtin: boolean;
}

interface StoredPlugin {
  id: string;
  name: string;
  source: string;
}

const DB_NAME = 'ordinal-interface';
const STORE = 'plugins';
const DB_VERSION = 1;

// ————————————————————————————————————————————————
//  内置记号注册表
// ————————————————————————————————————————————————

interface BuiltinDef {
  id: string;
  /**
   * 懒加载工厂。用动态 import 而不是静态 import，
   * 这样记号的实现代码不会全塞进主 bundle —— instantiate() 本来就是 async 的，
   * 改成懒加载对调用方完全透明。
   */
  load: () => Promise<ONP2Plugin>;
}

/**
 * 所有内置记号。**数组顺序即列表顺序，第一项是默认记号。**
 *
 * 新增一个内置记号：在 src/engine/ 下写好实现，然后在这里加一行
 *   { id: 'builtin:xxx', load: async () => (await import('./xxx')).xxxNotation },
 * UI、列表渲染、默认选中逻辑都是通用的，不需要再改别处。
 */
const BUILTINS: BuiltinDef[] = [
  {
    id: 'builtin:omega2',
    load: async () => (await import('./omega2')).omega2Notation,
  },
  {
    id: 'builtin:omegaOmega',
    load: async () => (await import('./omegaOmega')).omegaOmegaNotation,
  },
];

/** 内置记号的名字：启动时 import 一次取回来，之后列表直接用 */
const builtinNames = new Map<string, string>();

// ————————————————————————————————————————————————
//  极简 IndexedDB 封装
// ————————————————————————————————————————————————

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGetAll(): Promise<StoredPlugin[]> {
  return openDb().then(
    (db) =>
      new Promise<StoredPlugin[]>((resolve, reject) => {
        const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result as StoredPlugin[]);
        req.onerror = () => reject(req.error);
      }),
  );
}

function idbPut(rec: StoredPlugin): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(rec);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }),
  );
}

function idbDelete(id: string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const req = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }),
  );
}

/**
 * IndexedDB 在个别环境里（隐私模式、某些嵌入 WebView、无用户交互的自动化场景）
 * 既不会 resolve 也不会 reject —— 一直 pending。
 * 启动流程是 `await restorePlugins()`，一旦挂住整个应用就停在初始化之前（白屏），
 * 所以这里统一加超时兜底：超时就当"没有用户插件"，应用照常启动。
 */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((resolve) => window.setTimeout(() => resolve(fallback), ms)),
  ]);
}

const IDB_TIMEOUT = 3000;

// ————————————————————————————————————————————————
//  仓库
// ————————————————————————————————————————————————

let userEntries: PluginEntry[] = [];

/** 列出所有可用记号（内置在前、按 BUILTINS 顺序；用户上传的按添加顺序） */
export function listPlugins(): PluginEntry[] {
  const builtin = BUILTINS.map((b) => ({
    id: b.id,
    name: builtinNames.get(b.id) ?? b.id,
    builtin: true,
  }));
  return [...builtin, ...userEntries];
}

/**
 * 启动时装载：内置记号取名字（本地模块，代价极小），用户插件从 IndexedDB 读元信息
 * （不读源码，源码按需加载）。
 */
export async function restorePlugins(): Promise<void> {
  await Promise.all(
    BUILTINS.map(async (b) => {
      try {
        builtinNames.set(b.id, (await b.load()).name);
      } catch {
        builtinNames.delete(b.id); // 装载失败就不列出来，但应用照样启动
      }
    }),
  );

  try {
    const all = await withTimeout(idbGetAll(), IDB_TIMEOUT, [] as StoredPlugin[]);
    userEntries = all.map((r) => ({ id: r.id, name: r.name, builtin: false }));
  } catch {
    userEntries = [];
  }
}

/** 装载一个插件实例 */
export async function instantiate(entry: PluginEntry): Promise<ONP2Plugin> {
  const builtin = BUILTINS.find((b) => b.id === entry.id);
  if (builtin) return builtin.load();

  const all = await withTimeout(idbGetAll(), IDB_TIMEOUT, [] as StoredPlugin[]);
  const rec = all.find((r) => r.id === entry.id);
  if (!rec) throw new Error('插件源码已丢失，请重新添加');

  const url = URL.createObjectURL(new Blob([rec.source], { type: 'text/javascript' }));
  try {
    const mod = await import(/* @vite-ignore */ url);
    return resolvePlugin(mod);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * 「添加序数记号位置」：读取一个 .js 文件，试运行取到记号名称后入库。
 * 相当于原程序的"启动 exe、读握手串"这一步。
 */
export async function addPluginFromFile(file: File): Promise<PluginEntry> {
  const source = await file.text();

  let plugin: ONP2Plugin;
  try {
    const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    try {
      plugin = resolvePlugin(await import(/* @vite-ignore */ url));
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    throw new Error('这不是一个可用的 ONP2 插件：' + (err as Error).message);
  }

  if (listPlugins().some((e) => e.name === plugin.name)) {
    throw new Error(`记号「${plugin.name}」已经在列表里了`);
  }

  const id = 'user:' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await idbPut({ id, name: plugin.name, source });
  const entry: PluginEntry = { id, name: plugin.name, builtin: false };
  userEntries.push(entry);
  return entry;
}

/** 「删除序数记号位置」 */
export async function removePlugin(entry: PluginEntry): Promise<void> {
  if (entry.builtin) throw new Error('内置记号不能删除');
  await idbDelete(entry.id);
  userEntries = userEntries.filter((e) => e.id !== entry.id);
}

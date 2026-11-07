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
   * 记号名称。★ 新增字段：原先这里只有 load()，启动时为了拿名字要把每个内置记号
   * 都 import 一遍 —— 2 个时无所谓，32 个时等于把懒加载设计废掉了
   * （首屏就把全部记号代码拉下来）。改成在表里写死名字，启动时零 import。
   */
  name: string;
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
/**
 * 30 个复原记号的名字（按 id）。
 * 与 src/notations/*.ts 里的 `name` 字段保持一致；这里重复一份是为了
 * **启动时不必 import 任何记号模块**就能把列表画出来。
 * 新增记号时记得同步改这里 —— tests/verify.ts 有断言会兜住不一致。
 */
const NOTATION_NAMES: Record<string, string> = {
  bashicu_matrix: 'Bashicu Matrix',
  bm41: 'Bashicu Matrix 4.1',
  bms_row_extend: 'Limited Row-Extending BMS (non-Ceiling-upgrade)',
  bms_stronf: 'Stronf Bashicu Matrix',
  bms_upgradissimo: 'Upgradissimo Bashicu Matrix',
  coprime: 'Coprime Series sequence',
  hiun: 'Hierarchial Increase Unit Notation',
  kp_hydra: 'Simplified Primitive Sequence',
  lels: 'Linear Eternally Lifting Sequence',
  lprss: 'Long Primitive Sequence System',
  mfss: 'Multiple Father Sequence System (2 fathers)',
  parented_bms: 'Parented Bashicu Matrix',
  ppm: 'Parented Predecessor Matrix 2',
  ppm00t: 'Parented Predecessor Matrix 00T',
  ppm3: 'Parented Predecessor Matrix 3',
  pps2: 'Parented Predecessor Sequence 2',
  pps3: 'Parented Predecessor Sequence 3',
  pps4: 'Parented Predecessor Sequence 4',
  pps4_extremely_weak: 'extremely weak Parented Predecessor Sequence 4',
  pps4_second: 'second extremely weak Parented Predecessor Sequence 4',
  pps4_third: 'third weak Parented Predecessor Sequence 4',
  pps4_weak: 'weak Parented Predecessor Sequence 4',
  prss_parented: 'Parented Primitive Sequence System',
  pss_hydra: 'Simplified Pair Sequence',
  remainder_retention: 'Remainder Retention Sequence System',
  residue_class: 'Residue Class Sequence',
  simplified_minus2y: 'Simplified -2-Y Sequence',
  stos: 'Single Transfinity Ordinal Sequence',
  zero_y: '0-Y Sequence',
  zero_y_super_non_lifting: 'Ultimately Idealized 0-Y Sequence',
};

const BUILTINS: BuiltinDef[] = [
  {
    id: 'builtin:omega2',
    name: 'Omega2 (w^2)',
    load: async () => (await import('./omega2')).omega2Notation,
  },
  {
    id: 'builtin:omegaOmega',
    name: 'Omega^Omega (w^w)',
    load: async () => (await import('./omegaOmega')).omegaOmegaNotation,
  },
  // —— 以下 30 个由 ONP2 exe 反编译产物复原（见 src/notations/）——
  { id: 'builtin:bashicu_matrix', name: NOTATION_NAMES['bashicu_matrix'], load: async () => (await import('../notations/bashicu_matrix')).bashicuMatrix },
  { id: 'builtin:bm41', name: NOTATION_NAMES['bm41'], load: async () => (await import('../notations/bm41')).bm41 },
  { id: 'builtin:bms_row_extend', name: NOTATION_NAMES['bms_row_extend'], load: async () => (await import('../notations/bms_row_extend')).bmsRowExtend },
  { id: 'builtin:bms_stronf', name: NOTATION_NAMES['bms_stronf'], load: async () => (await import('../notations/bms_stronf')).bmsStronf },
  { id: 'builtin:bms_upgradissimo', name: NOTATION_NAMES['bms_upgradissimo'], load: async () => (await import('../notations/bms_upgradissimo')).bmsUpgradissimo },
  { id: 'builtin:coprime', name: NOTATION_NAMES['coprime'], load: async () => (await import('../notations/coprime')).coprime },
  { id: 'builtin:hiun', name: NOTATION_NAMES['hiun'], load: async () => (await import('../notations/hiun')).hiun },
  { id: 'builtin:kp_hydra', name: NOTATION_NAMES['kp_hydra'], load: async () => (await import('../notations/kp_hydra')).kpHydra },
  { id: 'builtin:lels', name: NOTATION_NAMES['lels'], load: async () => (await import('../notations/lels')).lels },
  { id: 'builtin:lprss', name: NOTATION_NAMES['lprss'], load: async () => (await import('../notations/lprss')).lprss },
  { id: 'builtin:mfss', name: NOTATION_NAMES['mfss'], load: async () => (await import('../notations/mfss')).mfss },
  { id: 'builtin:parented_bms', name: NOTATION_NAMES['parented_bms'], load: async () => (await import('../notations/parented_bms')).parentedBms },
  { id: 'builtin:ppm', name: NOTATION_NAMES['ppm'], load: async () => (await import('../notations/ppm')).ppm },
  { id: 'builtin:ppm00t', name: NOTATION_NAMES['ppm00t'], load: async () => (await import('../notations/ppm00t')).ppm00t },
  { id: 'builtin:ppm3', name: NOTATION_NAMES['ppm3'], load: async () => (await import('../notations/ppm3')).ppm3 },
  { id: 'builtin:pps2', name: NOTATION_NAMES['pps2'], load: async () => (await import('../notations/pps2')).pps2 },
  { id: 'builtin:pps3', name: NOTATION_NAMES['pps3'], load: async () => (await import('../notations/pps3')).pps3 },
  { id: 'builtin:pps4', name: NOTATION_NAMES['pps4'], load: async () => (await import('../notations/pps4')).pps4 },
  { id: 'builtin:pps4_extremely_weak', name: NOTATION_NAMES['pps4_extremely_weak'], load: async () => (await import('../notations/pps4_extremely_weak')).pps4ExtremelyWeak },
  { id: 'builtin:pps4_second', name: NOTATION_NAMES['pps4_second'], load: async () => (await import('../notations/pps4_second')).pps4Second },
  { id: 'builtin:pps4_third', name: NOTATION_NAMES['pps4_third'], load: async () => (await import('../notations/pps4_third')).pps4Third },
  { id: 'builtin:pps4_weak', name: NOTATION_NAMES['pps4_weak'], load: async () => (await import('../notations/pps4_weak')).pps4Weak },
  { id: 'builtin:prss_parented', name: NOTATION_NAMES['prss_parented'], load: async () => (await import('../notations/prss_parented')).prssParented },
  { id: 'builtin:pss_hydra', name: NOTATION_NAMES['pss_hydra'], load: async () => (await import('../notations/pss_hydra')).pssHydra },
  { id: 'builtin:remainder_retention', name: NOTATION_NAMES['remainder_retention'], load: async () => (await import('../notations/remainder_retention')).remainderRetention },
  { id: 'builtin:residue_class', name: NOTATION_NAMES['residue_class'], load: async () => (await import('../notations/residue_class')).residueClass },
  { id: 'builtin:simplified_minus2y', name: NOTATION_NAMES['simplified_minus2y'], load: async () => (await import('../notations/simplified_minus2y')).simplifiedMinus2y },
  { id: 'builtin:stos', name: NOTATION_NAMES['stos'], load: async () => (await import('../notations/stos')).stos },
  { id: 'builtin:zero_y', name: NOTATION_NAMES['zero_y'], load: async () => (await import('../notations/zero_y')).zeroY },
  { id: 'builtin:zero_y_super_non_lifting', name: NOTATION_NAMES['zero_y_super_non_lifting'], load: async () => (await import('../notations/zero_y_super_non_lifting')).zeroYSuperNonLifting },
];

/** 内置记号的名字：表里直接取，不再启动时 import */
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
    name: builtinNames.get(b.id) ?? b.name,
    builtin: true,
  }));
  return [...builtin, ...userEntries];
}

/**
 * 启动时装载：内置记号取名字（本地模块，代价极小），用户插件从 IndexedDB 读元信息
 * （不读源码，源码按需加载）。
 */
export async function restorePlugins(): Promise<void> {
  // 名字直接从表取，不再 import 记号模块 —— 32 个记号时这一步能省下首屏的全部记号代码
  for (const b of BUILTINS) builtinNames.set(b.id, b.name);

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

/**
 * ONP2 —— Ordinal Notation Protocol 2
 *
 * 原程序里「序数记号」是一个外部控制台 exe，主程序通过 stdin/stdout 跟它对话。
 * 网页版没有进程，所以把协议抽象成一组**同步函数调用**，插件形态由 exe 变成 JS 模块。
 *
 * 协议原文（与逆向结果逐条一致）：
 *   1. "1" + 有限数 a            → 最大序数 Limit 的基本列第 a 项
 *   2. "2" + 序数 a              → "1"=0 / "2"=后继序数 / "3"=极限序数
 *   3. "3" + 序数 a              → a 的前继序数
 *   4. "4" + 有限数 a + 序数 b   → b 的基本列第 a 项
 *   5. "5" + 序数 a + 序数 b     → a<b 返回 "2"，否则返回 "1"
 *   结果为 0 时一律返回字符串 "0"
 */

/** 最大序数。程序侧对它有短路：恒为极限序数、恒大于任何序数。 */
export const LIMIT = 'Limit';
/** 零。程序侧对它有短路：恒为最小。 */
export const ZERO = '0';

/** 序数类型码 */
export type TypeCode =
  | '1' // 0
  | '2' // 后继序数
  | '3'; // 极限序数

/**
 * 一个 ONP2 记号插件。
 *
 * 五个方法分别对应协议命令 1~5。全部是**纯函数**（同样的输入必须给同样的输出），
 * 宿主会据此做结果缓存。
 *
 * 注意：宿主（{@link EngineHost}）会对 `Limit` / `0` 做短路，
 * 但插件自己仍应当正确处理这两者 —— 因为命令 1、4 会把它们真的传进来。
 */
export interface ONP2Plugin {
  /** 记号系统名称，显示在记号列表里 */
  readonly name: string;
  /** 可选：插件自述 */
  readonly description?: string;

  /** 命令 1：Limit 的基本列第 a 项 */
  fsLimit(a: number): string;
  /** 命令 2：序数类型，返回 "1" / "2" / "3" */
  typeOf(a: string): string;
  /** 命令 3：前继序数 */
  pred(a: string): string;
  /** 命令 4：序数 b 的基本列第 a 项 */
  fs(a: number, b: string): string;
  /** 命令 5：a < b ? */
  less(a: string, b: string): boolean;
}

/** 插件模块的默认导出形态：可以是插件对象，也可以是返回插件对象的工厂函数 */
export type PluginModule = ONP2Plugin | (() => ONP2Plugin);

export function resolvePlugin(mod: unknown): ONP2Plugin {
  const def = (mod as { default?: PluginModule })?.default ?? (mod as PluginModule);
  const plugin = typeof def === 'function' ? (def as () => ONP2Plugin)() : def;
  if (!plugin || typeof plugin.name !== 'string') {
    throw new Error('插件缺少 name 字段，不是合法的 ONP2 插件');
  }
  for (const fn of ['fsLimit', 'typeOf', 'pred', 'fs', 'less'] as const) {
    if (typeof (plugin as unknown as Record<string, unknown>)[fn] !== 'function') {
      throw new Error(`插件 ${plugin.name} 缺少方法 ${fn}()`);
    }
  }
  return plugin;
}

/**
 * OmegaOmega —— ω^ω 以下的序数（第二个内置记号，也是一个"更强"的插件示例）
 *
 * 内部表示：一个系数数组 c，c[i] 是 ω^i 的系数，即序数 = Σ c[i]·ω^i。
 * 因为最高指数有限，所以这套表示覆盖的恰好是 ω^ω 以下的序数。
 *   c 全零           →  0
 *   c[0] > 0         →  后继序数
 *   c[0] = 0 且非零  →  极限序数
 *   limit = true     →  本系统的最大序数 Limit，也就是 ω^ω
 *
 * 表达式写法（全部 ASCII）：
 *   "0" / "5"                有限数
 *   "w" / "w*3"              ω / ω·3
 *   "w^2" / "w^2*3"          ω² / ω²·3
 *   "w^2*3+w*2+5"            ω²·3 + ω·2 + 5
 *   "w^2+w"                  ω² + ω
 *   "Limit"                  ω^ω（最大序数）
 * 另兼容 "w2" 这类省略 ^ 的写法（当作 ω²）。
 *
 * 基本列的定义（j = 最小的、系数非零的指数）：
 *   Limit  (ω^ω)  的第 n 项 = ω^(n+1)      —— 首项是 ω，递增到 ω^ω
 *   α 为极限序数时 α 的第 n 项 = (α 去掉一个 ω^j) + ω^(j-1)·n
 *     例：ω²   → ω·n        ω·3 → ω·2+n        ω²+ω·3 → ω²+ω·2+n
 *   有限数没有基本列（界面也不会对它发命令 1 / 4）
 *
 * ⚠ 性能提示：宿主 `FirstExceeding` 是线性递增扫描，`ValidateExpression` 又是
 *   从 Limit 逐位往下逼近，两者复杂度会相乘。ω^ω 下若表达式带很大的系数
 *   （如 w^2*9999），杂项页的校验会明显变慢。真要内置 ε₀、Γ₀ 这类更强的记号，
 *   需要先把 FirstExceeding 换成二分查找（基本列严格递增，二分是安全的）。
 */

import type { ONP2Plugin } from './types';

/** 指数上限，避免构造出离谱的大数组 */
const MAX_INDEX = 4096;

interface Ord {
  /** c[i] = ω^i 的系数 */
  c: number[];
  /** true = ω^ω，本系统的最大序数 */
  limit: boolean;
}

const zero = (): Ord => ({ c: [], limit: false });
const makeLimit = (): Ord => ({ c: [], limit: true });

/** ω^k */
function omegaPow(k: number): Ord {
  if (k < 0) k = 0;
  if (k > MAX_INDEX) throw new Error(`指数 ${k} 超出上限 ${MAX_INDEX}`);
  const c: number[] = [];
  c[k] = 1;
  return { c, limit: false };
}

/** 去掉尾部多余的 0，让 c.length 精确等于「最高指数 + 1」 */
function trim(c: number[]): number[] {
  let hi = c.length - 1;
  while (hi >= 0 && (c[hi] || 0) <= 0) hi--;
  c.length = hi + 1;
  return c;
}

function isZero(o: Ord): boolean {
  if (o.limit) return false;
  return trim([...o.c]).length === 0;
}

// ————————————————————————————————————————————————
//  表达式 ↔ 内部表示
// ————————————————————————————————————————————————

function parse(s: string | null | undefined): Ord {
  if (s == null) return zero();
  const text = String(s).trim();
  if (text === 'Limit') return makeLimit();

  const c: number[] = [];
  for (const raw of text.split('+')) {
    const part = raw.trim();
    if (!part) continue;

    // 纯数字 → 常数项
    if (/^\d+$/.test(part)) {
      c[0] = safeAdd(c[0] || 0, parseInt(part, 10));
      continue;
    }

    // "w" / "w2" / "w^2" / "w*3" / "w^2*3"
    const m = /^w\^?(\d+)?(?:\*(\d+))?$/.exec(part);
    if (!m) continue; // 无法识别的项直接忽略（与 Omega2 的兜底风格一致）

    const k = m[1] ? parseInt(m[1], 10) : 1;
    const coef = m[2] ? parseInt(m[2], 10) : 1;
    if (k < 1 || k > MAX_INDEX) continue;
    c[k] = safeAdd(c[k] || 0, coef);
  }

  trim(c);
  return { c, limit: false };
}

/** 安全相加，溢出就夹到 MAX_SAFE_INTEGER */
function safeAdd(a: number, b: number): number {
  const v = a + b;
  return Number.isSafeInteger(v) ? v : Number.MAX_SAFE_INTEGER;
}

function format(o: Ord): string {
  if (o.limit) return 'Limit';
  const terms: string[] = [];
  for (let i = o.c.length - 1; i >= 0; i--) {
    const coef = o.c[i] || 0;
    if (coef <= 0) continue;
    if (i === 0) terms.push(String(coef));
    else if (i === 1) terms.push(coef > 1 ? `w*${coef}` : 'w');
    else terms.push(coef > 1 ? `w^${i}*${coef}` : `w^${i}`);
  }
  return terms.length > 0 ? terms.join('+') : '0';
}

// ————————————————————————————————————————————————
//  五种运算
// ————————————————————————————————————————————————

/** 命令 2：序数类型。1 = 0，2 = 后继序数，3 = 极限序数 */
function typeCode(o: Ord): string {
  if (o.limit) return '3';
  if (isZero(o)) return '1';
  if ((o.c[0] || 0) > 0) return '2';
  return '3';
}

/** 命令 3：前继序数。极限序数 / 0 没有前继，返回 "0" 兜底 */
function predecessor(o: Ord): Ord {
  if (o.limit) return zero();
  const c = [...o.c];

  if ((c[0] || 0) > 0) {
    c[0] = (c[0] || 0) - 1;
    return { c: trim(c), limit: false };
  }
  // 兜底：极限序数 → 把最低的那个 ω^j 降掉一个（与 Omega2 的 pred("w*3")="w*2" 同风格）
  for (let j = 1; j < c.length; j++) {
    if ((c[j] || 0) > 0) {
      c[j] = (c[j] || 0) - 1;
      return { c: trim(c), limit: false };
    }
  }
  return zero();
}

/** 命令 1 / 4：基本列的第 n 项 */
function fsTerm(o: Ord, n: number): Ord {
  if (n < 0) n = 0;

  // ω^ω 的基本列：ω, ω², ω³, ...
  if (o.limit) return omegaPow(n + 1);

  // 有限数 / 后继序数没有基本列（界面也不会对它发命令 1 / 4）
  if ((o.c[0] || 0) > 0 || isZero(o)) return zero();

  // j = 最小的、系数非零的指数
  let j = 1;
  while (j < o.c.length && (o.c[j] || 0) <= 0) j++;
  if (j >= o.c.length) return zero();

  const c = [...o.c];
  c[j] = (c[j] || 0) - 1;
  if (j - 1 >= 0) c[j - 1] = n; // 原本 c[j-1] 必为 0（j 是最小的非零指数）
  return { c: trim(c), limit: false };
}

/** 命令 5：比较大小。a < b 返回 true */
function lessThan(x: Ord, y: Ord): boolean {
  if (x.limit) return false;
  if (y.limit) return true;

  const m = Math.max(x.c.length, y.c.length);
  for (let i = m - 1; i >= 0; i--) {
    const a = x.c[i] || 0;
    const b = y.c[i] || 0;
    if (a !== b) return a < b;
  }
  return false;
}

// ————————————————————————————————————————————————
//  插件导出
// ————————————————————————————————————————————————

export const omegaOmegaNotation: ONP2Plugin = {
  name: 'OmegaOmega (w^w)',
  description: 'ω^ω 以下的序数，Σ c[i]·ω^i 形式。最大序数 Limit = ω^ω',

  fsLimit(a: number): string {
    return format(fsTerm(makeLimit(), a));
  },
  typeOf(a: string): string {
    return typeCode(parse(a));
  },
  pred(a: string): string {
    return format(predecessor(parse(a)));
  },
  fs(a: number, b: string): string {
    return format(fsTerm(parse(b), a));
  },
  less(a: string, b: string): boolean {
    return lessThan(parse(a), parse(b));
  },
};

/** 导出内部表示，供测试用 */
export const _internal = { parse, format, typeCode, predecessor, fsTerm, lessThan, isZero };

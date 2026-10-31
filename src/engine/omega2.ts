/**
 * Omega2Notation —— 从 examples/Omega2Notation/Program.vb 逐行移植的 ONP2 插件。
 *
 * 它实现 ω² 以下的序数，内部用一对整数 (A, B) 表示 ω·A + B：
 *   A = 0, B = 0   →  0
 *   A = 0, B > 0   →  有限数 B
 *   A > 0          →  ω·A + B
 *   A = -1         →  本系统的最大序数 Limit，也就是 ω²
 *
 * 表达式写法（全部 ASCII）：
 *   "0" / "5" / "12"     有限数
 *   "w"                  ω
 *   "w*3"                ω·3
 *   "w*3+7"              ω·3 + 7
 *   "w+7"                ω + 7
 *   "Limit"              ω²（最大序数）
 *
 * 基本列的定义：
 *   Limit  (ω²)   的第 n 项 = ω·n
 *   ω·A    (A>0)  的第 n 项 = ω·(A-1) + n
 *   有限数没有基本列（界面也不会对它发命令 1 / 4）
 */

import type { ONP2Plugin } from './types';

const LIMIT_A = -1;

/** VB 的 Long.MaxValue，用于比较时把 Limit 映射到"无穷大" */
const LONG_MAX = Number.MAX_SAFE_INTEGER;

interface Ord {
  A: number;
  B: number;
}

const ord = (A: number, B: number): Ord => ({ A, B });
const makeLimit = (): Ord => ord(LIMIT_A, 0);

// ————————————————————————————————————————————————
//  表达式 ↔ 内部表示
// ————————————————————————————————————————————————

function parse(s: string | null | undefined): Ord {
  if (s == null) return ord(0, 0);
  s = s.trim();
  if (s === 'Limit') return makeLimit();

  if (s.startsWith('w')) {
    // 形如 "w"、"w+b"、"w*a"、"w*a+b"（另兼容 "w2" 这种写法）
    let a = 1;
    let b = 0;
    const rest = s.substring(1);

    if (rest.startsWith('*')) {
      const tail = rest.substring(1);
      const plus = tail.indexOf('+');
      if (plus >= 0) {
        a = parseInt(tail.substring(0, plus), 10);
        b = parseInt(tail.substring(plus + 1), 10);
      } else {
        a = parseInt(tail, 10);
      }
    } else if (rest.startsWith('+')) {
      b = parseInt(rest.substring(1), 10);
    } else if (rest.length > 0) {
      // 兼容 "w2" 这种写法：直接把数字当成 ω 的系数
      const plus = rest.indexOf('+');
      if (plus >= 0) {
        a = parseInt(rest.substring(0, plus), 10);
        b = parseInt(rest.substring(plus + 1), 10);
      } else {
        a = parseInt(rest, 10);
      }
    }

    if (Number.isNaN(a)) a = 1;
    if (Number.isNaN(b)) b = 0;
    if (a <= 0) a = 1;
    return ord(a, b);
  }

  // 纯数字：有限数
  const n = Number(s);
  if (/^-?\d+$/.test(s) && Number.isSafeInteger(n)) return ord(0, n);
  return ord(0, 0);
}

function format(o: Ord): string {
  if (o.A === LIMIT_A) return 'Limit';
  if (o.A === 0) return String(o.B);
  let s = 'w';
  if (o.A > 1) s += '*' + o.A;
  if (o.B > 0) s += '+' + o.B;
  return s;
}

// ————————————————————————————————————————————————
//  五种运算
// ————————————————————————————————————————————————

/** 命令 2：序数类型。1 = 0，2 = 后继序数，3 = 极限序数 */
function typeCode(o: Ord): string {
  if (o.A === LIMIT_A) return '3';
  if (o.A === 0 && o.B === 0) return '1';
  if (o.B > 0) return '2';
  return '3'; // A > 0 且 B = 0，即 ω·A，是极限序数
}

/** 命令 3：前继序数。极限序数 / 0 没有前继，返回 "0" 兜底 */
function predecessor(o: Ord): Ord {
  if (o.B > 0) return ord(o.A, o.B - 1);
  if (o.A > 0 && o.A !== LIMIT_A) return ord(o.A - 1, 0); // 兜底：ω·A → ω·(A-1)
  return ord(0, 0);
}

/** 命令 1 / 4：基本列的第 n 项 */
function fsTerm(o: Ord, n: number): Ord {
  if (n < 0) n = 0;
  if (o.A === LIMIT_A) {
    // ω² 的基本列：ω·0, ω·1, ω·2, ...
    return ord(n, 0);
  }
  if (o.A > 0 && o.B === 0) {
    // ω·A 的基本列：ω·(A-1), ω·(A-1)+1, ω·(A-1)+2, ...
    return ord(o.A - 1, n);
  }
  // 有限数没有基本列，界面不会对它发命令 1 / 4
  return ord(0, 0);
}

/** 命令 5：比较大小。a < b 返回 true */
function lessThan(x: Ord, y: Ord): boolean {
  const xa = x.A === LIMIT_A ? LONG_MAX : x.A;
  const ya = y.A === LIMIT_A ? LONG_MAX : y.A;
  if (xa !== ya) return xa < ya;
  return x.B < y.B;
}

// ————————————————————————————————————————————————
//  插件导出
// ————————————————————————————————————————————————

export const omega2Notation: ONP2Plugin = {
  name: 'Omega2 (w^2)',
  description: 'ω² 以下的序数，ω·A+B 形式。最大序数 Limit = ω²',

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
export const _internal = { parse, format, typeCode, predecessor, fsTerm, lessThan };

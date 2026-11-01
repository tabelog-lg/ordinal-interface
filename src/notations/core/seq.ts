/**
 * 一维序列类记号的共通框架（对应复原版 C++ 的 common.h）。
 *
 * 内部表示：int a[500]，以 0 作结束哨兵。部分记号为把 0 让给哨兵，
 * 存储时整体 +1（BIAS=1），输出时再 -1。
 * 原程序用全局量 x / y / l / pm[] 在函数间传递尺寸，这里改成类的字段，
 * 语义不变但不会跨调用串味。
 */

export const SEQMAX = 500;

/** C 的 atoi(s + i)：从字符串第 i 个字符起解析一个整数，前导空白跳过，失败返回 0 */
export function atoiAt(s: string, i: number): number {
  while (i < s.length && (s[i] === ' ' || s[i] === '\t' || s[i] === '\n' || s[i] === '\r')) i++;
  let j = i;
  if (s[j] === '+' || s[j] === '-') j++;
  const start = j;
  while (j < s.length && s[j] >= '0' && s[j] <= '9') j++;
  if (j === start) return 0;
  const v = Number.parseInt(s.slice(i, j), 10);
  return Number.isNaN(v) ? 0 : v;
}

/**
 * txar(): "12,3,45" -> number[501]，末尾补 0。
 * bias=1 时每个元素 +1（把 0 让给结束哨兵），输出侧再 -1。
 * 步进用的是原程序的写法 (int)log10(v*100+1)，即「数字位数 + 1(逗号)」。
 */
export function txar(s: string, bias = 0): number[] {
  const buf = new Array<number>(501).fill(0);
  const len = s.length;
  let n = 0;
  for (let i = 0; i < len && n < SEQMAX; ) {
    const v = atoiAt(s, i);
    buf[n] = v + bias;
    const stored = v + (bias ? 1 : 0);
    // 原程序直接 i += (int)log10(stored*100+1)：stored == 0 时步进为 0，
    // 会死循环并把后面的元素全部冲成 0（C 里还会写越界）。
    // 按「数字位数 + 1 个分隔符」的本来语义，stored == 0 时步进应为 2。
    i += stored > 0 ? Math.trunc(Math.log10(stored * 100 + 1)) : 2;
    n++;
  }
  return buf;
}

/** 序列输出：a[i]+off，逗号分隔；空序列输出 "0" */
export function arout(a: number[], off = 0): string {
  const g = (i: number) => a[i] ?? 0;
  if (g(0) === 0) return '0';
  const parts: string[] = [];
  for (let i = 0; g(i) !== 0; i++) parts.push(String(g(i) + off));
  return parts.join(',');
}

/** 1 起址 + 空格分隔的变体（Remainder Retention 专用） */
export function arout1(a: number[]): string {
  const g = (i: number) => a[i] ?? 0;
  if (g(1) === 0) return '0';
  const parts: string[] = [];
  for (let i = 1; g(i) !== 0; i++) parts.push(String(g(i)));
  return parts.join(' ');
}

/**
 * limit：输出 1,2,...,n。
 * 原程序写成 while(!(n < i))，会多吐一个元素 —— 这个 off-by-one 原样保留，
 * 以便与 exe 输出逐字节比对。
 */
export function seqLimit(n: number, _bias: number): number[] {
  const a = new Array<number>(501).fill(0);
  for (let i = 0; ; i++) {
    if (n < i) break;
    a[i] = i + 1;
  }
  return a;
}

/** limit（MFSS 变体）：不多吐元素 */
export function seqLimitExact(n: number, _bias: number): number[] {
  const a = new Array<number>(501).fill(0);
  a[0] = 1;
  for (let i = 1; ; i++) {
    if (n <= i) break;
    a[i] = i + 1;
  }
  return a;
}

/** limit（只给一个元素 {1} 的变体，原程序忽略参数） */
export function seqLimitOne(_n: number): number[] {
  const a = new Array<number>(501).fill(0);
  a[0] = 1;
  return a;
}

/**
 * limit：第 a 项 = 1,a+1（例如 (0) 1,1  (1) 1,2  (2) 1,3）
 * —— 0-Y / 0-Y 超无提升 / Coprime / 简化 -2-Y / 余数类 这 5 个记号的
 * 「最大序数的基本列」就是这个，由源 exe 实测确认。
 */
export function seqLimitTwo(n: number): number[] {
  const a = new Array<number>(501).fill(0);
  a[0] = 1;
  a[1] = n + 1;
  return a;
}

/** type0: 空->1；末元素为最小值->2（后继）；否则->3（极限） */
export function seqType0(s: string, bias: number): string {
  const a = txar(s, bias);
  let n = 0;
  while ((a[n] ?? 0) !== 0) n++;
  if ((a[0] ?? 0) === 0) return '1';
  if ((a[n - 1] ?? 0) === 1) return '2';
  return '3';
}

/** compare0: 逐位比较，a<b 输出 "2"，否则输出 "1" */
export function seqCompare(sa: string, sb: string, bias: number): string {
  const a = new Array<number>(502).fill(0);
  const p = txar(sa, bias);
  for (let i = 0; (p[i] ?? 0) !== 0; i++) a[i] = p[i];
  const q = txar(sb, bias);
  // 原程序靠「读到数组之外」来终止（未定义行为）；这里显式给上界，
  // 完全相等时按 a >= b 返回 "1" —— 与原 exe 在合法输入上的结果一致
  let i = 0;
  while (i < 502 && (a[i] ?? 0) === (q[i] ?? 0)) i++;
  if (i >= 502) return '1';
  return (a[i] ?? 0) < (q[i] ?? 0) ? '2' : '1';
}

/** 1 起址版本（Remainder Retention 专用） */
export function seqCompare1(sa: string, sb: string): string {
  const a = new Array<number>(502).fill(0);
  const p = txar1(sa);
  for (let i = 1; (p[i] ?? 0) !== 0; i++) a[i] = p[i];
  const q = txar1(sb);
  let i = 0;
  while (i < 502 && (a[i] ?? 0) === (q[i] ?? 0)) i++;
  if (i >= 502) return '1';
  return (a[i] ?? 0) < (q[i] ?? 0) ? '2' : '1';
}

/** 1 起址的解析器（对应 Remainder Retention.exe 的 txar） */
export function txar1(s: string): number[] {
  const buf = new Array<number>(501).fill(0);
  const len = s.length;
  let n = 1;
  for (let i = 0; i < len && n < SEQMAX; ) {
    const v = atoiAt(s, i);
    buf[n++] = v;
    i += v > 0 ? Math.trunc(Math.log10(v * 100 + 1)) : 2;
  }
  return buf;
}

/**
 * pare(): Y 系列用 —— 沿 pm 链从 i 往上走，判断 j 是否为 i 的祖先。
 * pm[c] 存的是「父下标 + 1」，-1 表示没有父。
 */
export function pare(i: number, j: number, pm: number[]): number {
  let c = i;
  do {
    if (j === (pm[c] ?? 0) - 1) return 1;
    c = (pm[c] ?? 0) - 1;
  } while (-1 < c);
  return 0;
}

/** max */
export function max2(a: number, b: number): number {
  return a < b ? b : a;
}

// ————————————————————————————————————————————————
//  Parented Predecessor Sequence 家族（PrSS / PPS2 / PPS3 / PPS4 及 4 个弱化版）
//  七份 exe 的 Ex() 骨架完全相同，只有两处不同：
//    (a) 末元素的「降级」方式 -> decMode
//    (b) 提升点是否再抬一档   -> liftMode
// ————————————————————————————————————————————————

export const DecMode = {
  /** PPS2 / PPS3：a[x-1] -= 1 */
  DEC_MINUS1: 0,
  /** PPS4：向下扫到 a[c] <= a[p] */
  DEC_SCAN_LE: 1,
  /** weak / third：向下扫到 a[c] == a[p] */
  DEC_SCAN_EQ: 2,
  /** second / extremely weak：同上，且遇更小值直接跳到边界 */
  DEC_SCAN_EQ_SKIP: 3,
} as const;
export type DecMode = (typeof DecMode)[keyof typeof DecMode];

export function ppsEx(a: number[], n: number, x: number, decMode: DecMode, liftMode: boolean): void {
  const g = (i: number) => a[i] ?? 0;
  const v = g(x - 1); // 末元素（存储值，真实值 = v-1）
  const p = v - 2; // 父下标
  const L = x - 1 - p; // 每一段的长度

  // --- 步骤 1：若末元素与其父之间存在与父同值的元素，先把末元素拉回父值 ---
  for (let i = x - 2; i > p; i--) if (g(i) === g(p)) a[x - 1] = g(p);

  // --- 步骤 2：末元素降级 ---
  if (g(x - 1) !== g(p)) {
    if (decMode === DecMode.DEC_MINUS1) {
      a[x - 1] = g(x - 1) - 1;
    } else {
      for (let c = g(x - 1) - 3; g(p) - 1 <= c; c--) {
        const hit = decMode === DecMode.DEC_SCAN_LE ? g(c) <= g(p) : g(c) === g(p);
        if (hit) {
          a[x - 1] = c + 2;
          break;
        }
        if (decMode === DecMode.DEC_SCAN_EQ_SKIP && g(c) < g(p)) c = g(p) - 1;
        if (c === g(p) - 1) a[x - 1] = g(p);
      }
    }
  }

  // --- 步骤 3：按段复制 n 次 ---
  for (let c = 0; c < n; c++) {
    for (let j = 0; j < L; j++) {
      const i = x - 1 + c * L + j;
      if ((i - p) % L === 0) {
        // 提升点
        if (!liftMode) a[i + L] = g(i);
        else if (g(x - 1) === g(p)) a[i + L] = g(i);
        else a[i + L] = g(i) + L;
      } else if (v - 1 < g(i - L)) {
        a[i] = g(i - L) + L;
      } else {
        a[i] = g(i - L);
      }
    }
  }
  a[n * L + x - 1] = 0; // 结束哨兵
}

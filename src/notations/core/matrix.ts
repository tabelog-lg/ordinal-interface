/**
 * 二维矩阵类记号的共通框架（对应复原版 C++ 的 common.h 里 txma / maout 部分）。
 *
 * 内部表示：int m[300][C]，按行展平成 number[] 存（下标 r*C+j），
 * C 由各记号给定（Bashicu 系 20，Row-Extend 系 40）。
 * x = 行数、y = 列数。
 */

import { txar, max2 } from './seq';

export const ROWMAX = 300;

/** 单个 cell 的读取：越界（原程序会读到相邻内存）这里按 0 处理 */
export function cell(m: number[], i: number): number {
  return m[i] ?? 0;
}

/**
 * txma():  "(0,0)(1,1)(2,2)" -> 展平矩阵，同时给出行列数。
 * ymode 0: 列数由第 2 行的字符串长度推出 (len>>1)+1   （Bashicu 系）
 * ymode 1: 列数由第 2 行最后一个非 0 列推出           （LELS）
 * ymode 2: 不推断（Row-Extend 用固定 C，行内变长）
 *
 * 原程序是逐字符改 buf 里的 '(' / ')' 为 ',' 来推进的，这里照原样模拟。
 */
export type MatrixParse = { m: number[]; rows: number; cols: number };

/**
 * 快速路径：一次线性扫描解析标准矩阵串 `(a,b,...)(c,d,...)...`。
 *
 * 原实现（见 txmaLegacy）把 `( / )` 逐个改成 `,` 后反复 indexOf，是 O(n²)：
 * 每个括号都从头扫一遍字符串。这里改成单游标推进，语义逐字相同：
 * 每轮取「第一个 `(` 到第一个 `)`」之间的内容作为一行，游标跳到 `)` 之后。
 *
 * 只对**标准串**走快路径：一旦出现嵌套括号、未闭合括号、非数字/逗号/空白字符
 * 或尾部多余内容，就返回 null，由 txma() 回退到 txmaLegacy()。这样畸形输入
 * （原 C 程序靠越界读内存，行为本来就不定义）的行为一字不变，不会与序数尺 /
 * 展开树组合出新问题。
 */
function txmaFast(s: string, C: number, ymode: number): MatrixParse | null {
  const m = new Array<number>(ROWMAX * C).fill(0);
  const L = s.length;
  let i = 0;
  let rows = 0;
  let cols = 0;
  while (i < L && rows < ROWMAX) {
    if (s.charCodeAt(i) !== 40 /* '(' */) return null;
    const start = i + 1;
    let j = start;
    while (j < L && s.charCodeAt(j) !== 41 /* ')' */) {
      const c = s.charCodeAt(j);
      const numeric = c >= 48 && c <= 57;
      const sep = c === 44 || c === 32 || c === 9 || c === 10 || c === 13 || c === 43 || c === 45;
      if (!numeric && !sep) return null; // 含 '(' / 字母 / 其它字符 → 回退
      j++;
    }
    if (j >= L) return null; // 没有闭合 ')'
    const cellStr = s.slice(start, j);
    const row = txar(cellStr);
    for (let k = 0; k < C; k++) m[rows * C + k] = row[k] ?? 0;
    rows++;
    if (rows === 2) {
      // 原 C++ 用 strlen(sr)/2+1 推断列数，隐式假定每个元素都是一位数；
      // 第 2 行出现 10/11/… 时会算多列，展开随即越界。按实际元素个数推断。
      if (ymode === 0) cols = cellStr.split(',').length;
      if (ymode === 1) {
        let t = C - 1;
        while (t > 0 && m[1 * C + t] === 0) t--;
        cols = t + 2;
      }
    }
    i = j + 1;
  }
  if (i !== L) return null; // 尾部有多余字符 → 回退（原实现会忽略，交给 legacy 复现）
  return { m, rows, cols };
}

/** 原逐字符模拟实现，仅在 txmaFast 判定不适用时作为回退，保证畸形输入行为不变。 */
function txmaLegacy(s: string, C: number, ymode: number): MatrixParse {
  const m = new Array<number>(ROWMAX * C).fill(0);
  const buf = s.split('');
  let rows = 0;
  let cols = 0;
  for (let r = 0; r < ROWMAX; r++) {
    let p = buf.indexOf('(');
    if (p < 0) break;
    let cellStr = '';
    for (;;) {
      p++;
      const q = buf.indexOf(')');
      if (q <= p) break;
      cellStr += buf[p];
    }
    const row = txar(cellStr);
    for (let j = 0; j < C; j++) m[r * C + j] = row[j] ?? 0;
    rows++;
    if (rows === 2) {
      if (ymode === 0) cols = cellStr.split(',').length;
      if (ymode === 1) {
        let t = C - 1;
        while (t > 0 && m[1 * C + t] === 0) t--;
        cols = t + 2;
      }
    }
    const open = buf.indexOf('(');
    if (open >= 0) buf[open] = ',';
    const q = buf.indexOf(')');
    if (q < 0 || q + 1 >= buf.length) break;
    buf[q] = ',';
  }
  return { m, rows, cols };
}

export function txma(s: string, C: number, ymode: number): MatrixParse {
  return txmaFast(s, C, ymode) ?? txmaLegacy(s, C, ymode);
}

/**
 * 一次解析同时给出类型码。`MatrixNotation.fs()` 原来先跑 matrixType0()（内部一次
 * txma）再跑 txma()，同一个串解析两遍；合并后只解析一次，输出逐字相同。
 */
export function matrixParse(
  s: string,
  C: number,
  ymode: number,
  fullCol = false,
): MatrixParse & { typeCode: string } {
  const r = txma(s, C, ymode);
  if (s.length < 3) return { ...r, typeCode: '1' };
  const y = fullCol ? C : r.cols;
  let allzero = true;
  for (let j = 0; j < y; j++) if (cell(r.m, (r.rows - 1) * C + j) !== 0) allzero = false;
  return { ...r, typeCode: allzero ? '2' : '3' };
}

/** 一行：(a,b,c) */
export function arow(m: number[], C: number, r: number, cols: number): string {
  const parts: string[] = [];
  for (let j = 0; j < cols; j++) parts.push(String(cell(m, r * C + j)));
  return '(' + parts.join(',') + ')';
}

/** 整个矩阵 */
export function maout(m: number[], C: number, rows: number, cols: number): string {
  let out = '';
  for (let r = 0; r < rows; r++) out += arow(m, C, r, cols);
  return out;
}

/** 行内变长输出：遇到 0 收尾（Row-Extend 专用） */
export function arowVar(m: number[], C: number, r: number): string {
  let out = '(';
  for (let j = 0; ; j++) {
    const v = cell(m, r * C + j);
    out += String(v);
    if (cell(m, r * C + j + 1) === 0) {
      out += ')';
      break;
    }
    out += ',';
  }
  return out;
}

export function maoutVar(m: number[], C: number, rows: number): string {
  let out = '';
  for (let r = 0; r < rows; r++) out += arowVar(m, C, r);
  return out;
}

/** 字典序比较两个长度为 lim 的片段：-1 / 0 / 1 */
export function comp(a: number[], b: number[], lim = 300): number {
  let j = 0;
  while (j < lim && a[j] === b[j]) j++;
  if (a[j] < b[j]) return -1;
  if (b[j] < a[j]) return 1;
  return 0;
}

/** 矩阵类 type0：末行全 0 -> 2（后继），否则 3（极限）；空串 -> 1 */
export function matrixType0(s: string, C: number, ymode: number, fullCol = false): string {
  // 走轻量路径：typeOf() 只要一个类型码，不构造 matrixParse 的复合返回对象。
  // 解析本身仍走 txma() 的快路径。
  if (s.length < 3) return '1';
  const { m, rows, cols } = txma(s, C, ymode);
  const y = fullCol ? C : cols;
  let allzero = true;
  for (let j = 0; j < y; j++) if (cell(m, (rows - 1) * C + j) !== 0) allzero = false;
  return allzero ? '2' : '3';
}

/** 矩阵类 precursor：去掉末行 */
export function matrixPrecursor(
  s: string,
  C: number,
  ymode: number,
  dy = 0,
  varRow = false,
): string {
  const { m, rows, cols } = txma(s, C, ymode);
  const x = rows;
  const y = cols;
  if (x <= 1) return '0';  // 空矩阵 / 单列矩阵的前驱都是 0
  if (varRow) return maoutVar(m, C, x - 1);
  return maout(m, C, x - 1, y + dy);
}

/** 矩阵类 compare0：先逐行比，行数更多者更大 */
export function matrixCompare(sa: string, sb: string, C: number, ymode: number): boolean {
  if (sb.length < 3) return false; // 输出 "1"
  if (sa.length <= 2) return true; // 输出 "2"

  const A = txma(sa, C, ymode);
  const B = txma(sb, C, ymode);
  const rowsA = A.rows;
  const rowsB = B.rows;
  // 等价于 comp(mb.slice(i*C), buf.slice(i*C), 300)（原实现靠 concat(pad) 把越界读
  // 补成 0）：直接在原数组上按偏移比 300 格，省掉每行两次 O(ROWMAX*C) 的 slice。
  const cmpRow = (i: number): number => {
    const off = i * C;
    for (let j = 0; j < 300; j++) {
      const x = B.m[off + j] ?? 0;
      const y = A.m[off + j] ?? 0;
      if (x < y) return -1;
      if (y < x) return 1;
    }
    return 0;
  };
  let i = 0;
  while (cmpRow(i) === 0 && i < max2(rowsB, rowsA)) i++;
  const r = cmpRow(i);
  // r != -1 && (r != 0 || rowsA < rowsB) -> "2" 即 a<b
  return r !== -1 && (r !== 0 || rowsA < rowsB);
}

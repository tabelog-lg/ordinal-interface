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
export function txma(
  s: string,
  C: number,
  ymode: number,
): { m: number[]; rows: number; cols: number } {
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
      if (ymode === 0) cols = (cellStr.length >> 1) + 1;
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
  if (s.length < 3) return '1';
  const { m, rows, cols } = txma(s, C, ymode);
  const x = rows;
  const y = fullCol ? C : cols;
  let allzero = true;
  for (let j = 0; j < y; j++) if (cell(m, (x - 1) * C + j) !== 0) allzero = false;
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
  if (x === 1) return '0';
  if (varRow) return maoutVar(m, C, x - 1);
  return maout(m, C, x - 1, y + dy);
}

/** 矩阵类 compare0：先逐行比，行数更多者更大 */
export function matrixCompare(sa: string, sb: string, C: number, ymode: number): boolean {
  if (sb.length < 3) return false; // 输出 "1"
  if (sa.length <= 2) return true; // 输出 "2"

  const A = txma(sa, C, ymode);
  const B = txma(sb, C, ymode);
  // 原程序这两块缓冲多留了 300，防止 comp() 读越界；这里同样补齐
  const pad = new Array<number>(300).fill(0);
  const buf = A.m.concat(pad);
  const mb = B.m.concat(pad);

  const rowsA = A.rows;
  const rowsB = B.rows;

  let i = 0;
  while (comp(mb.slice(i * C), buf.slice(i * C), 300) === 0 && i < max2(rowsB, rowsA)) i++;
  const r = comp(mb.slice(i * C), buf.slice(i * C), 300);
  // r != -1 && (r != 0 || rowsA < rowsB) -> "2" 即 a<b
  return r !== -1 && (r !== 0 || rowsA < rowsB);
}

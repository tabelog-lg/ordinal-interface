/**
 * Bashicu 系矩阵记号共用的「父 / 祖先判定」（对应复原版 C++ 的 matrix_bms.h）。
 *
 * 矩阵按 int m[300][C] 展平存储；C++ 里 par() 返回指向父元素的指针、
 * 用「指针 - 基址」推算行号，这里直接返回展平下标。
 */

import { cell } from './matrix';

/**
 * bmsPar(): 求下标 cellIdx 处元素的父，返回父的下标。
 *   * 第 0 列：向上（行号减小）找第一个严格更小的元素
 *   * 其余列：先向左递归收集候选行，再向上取第一个「更小且行号在候选中」的
 */
export function bmsPar(cellIdx: number, k: number, C: number, m: number[]): number {
  let q = cellIdx;
  if (k % C === 0) {
    while (cell(m, cellIdx) <= cell(m, q)) {
      q -= C;
      if (q < 0) break; // 原程序无此边界检查（走到矩阵上方即越界）
    }
  } else {
    // 不预填 301 个 0：只有 buf[1..c] 会被写，未写位置按 0 读（与 fill(0) 等价）。
    const buf = new Array<number>(301);
    let c = 0;
    let p = cellIdx;
    while (0 < p && cell(m, p - 1) !== 0) {
      q = bmsPar(p - 1, k + (p - cellIdx) - 1, C, m);
      p = q + 1;
      c++;
      buf[c] = Math.floor(((p - cellIdx) + k) / C);
    }
    const n = c;
    let found = 0;
    for (p = cellIdx; 0 < p; p -= C) {
      if (cell(m, p) < cell(m, cellIdx)) {
        for (let i = n; i >= 0; i--)
          if (Math.floor(((p - cellIdx) + k) / C) === (buf[i] ?? 0)) {
            found = 1;
            break;
          }
      }
      if (found) return p;
    }
  }
  return q;
}

/**
 * bmsAsmt(): 判断 cell 所在的这一列是否「抬升」——
 * 沿父链上溯，若链上出现目标行 target 则抬升 (1)，否则不抬 (0)。
 */
export function bmsAsmt(cellIdx: number, target: number, k: number, C: number, m: number[]): number {
  const buf = new Array<number>(301);
  if (cell(m, cellIdx) !== 0) {
    let q = cellIdx;
    let c = 0;
    // 原程序这里是一个可能不终止的 while；加迭代上限只为防呆，正常输入不会触发
    for (let guard = 0; 0 < q && cell(m, q) !== 0 && guard < 10000; guard++) {
      q = bmsPar(q, k + (q - cellIdx), C, m);
      buf[c] = Math.floor(((q - cellIdx) + k) / C);
      if (cell(m, q) === 0) {
        const v = Math.floor(((q - cellIdx) + k) / C);
        if (v !== target && -1 < v - target) return 0;
      }
      c++;
    }
    for (let i = c + 1; i >= 0; i--) if (target === (buf[i] ?? 0)) return 1;
  }
  return 0;
}

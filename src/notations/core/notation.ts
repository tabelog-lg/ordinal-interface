/**
 * 记号基类。把复原版 C++ 里的「全局 x / y / l / pm[]」收成实例字段，
 * 这样每个插件实例互不干扰（宿主要求五个方法都是纯函数）。
 */

import type { ONP2Plugin } from '../../engine/types';
import { SEQMAX, txar, arout, seqLimit, seqType0, seqCompare } from './seq';
import { ROWMAX, txma, maout, maoutVar, matrixType0, matrixPrecursor, matrixCompare } from './matrix';

export abstract class Notation implements ONP2Plugin {
  abstract readonly name: string;
  readonly description?: string;

  /** 序列长度 / 矩阵行数 */
  protected x = 0;
  /** 矩阵列数 */
  protected y = 0;
  /** 展开步长（Y 系列、余数类） */
  protected l = 0;
  /** 父索引表（Y 系列） */
  protected pm: number[] = new Array<number>(SEQMAX).fill(0);

  abstract fsLimit(a: number): string;
  abstract typeOf(a: string): string;
  abstract pred(a: string): string;
  abstract fs(a: number, b: string): string;
  abstract less(a: string, b: string): boolean;
}

// ————————————————————————————————————————————————
//  一维序列
// ————————————————————————————————————————————————

export abstract class SeqNotation extends Notation {
  /** 存储偏移：1 表示内部 +1 存储（把 0 让给结束哨兵），输出时再 -1 */
  protected bias = 0;

  /** 该记号的展开规则（对应各 exe 的 Ex()） */
  protected abstract ex(a: number[], n: number): void;

  /** limit 的默认实现：1,2,...,n（带原程序的 off-by-one） */
  protected limitArr(n: number): number[] {
    return seqLimit(n, this.bias);
  }
  protected parse(s: string): number[] {
    return txar(s, this.bias);
  }
  protected out(a: number[]): string {
    return arout(a, -this.bias);
  }

  fsLimit(a: number): string {
    return this.out(this.limitArr(a));
  }
  typeOf(s: string): string {
    return seqType0(s, this.bias);
  }
  pred(s: string): string {
    const a = this.parse(s);
    let n = 1;
    while ((a[n] ?? 0) !== 0) n++;
    this.x = n;
    a[n - 1] = 0;
    // 长度为 1 时原程序改指向一块全 0 的静态缓冲，输出 "0"
    return this.out(this.x === 1 ? new Array<number>(SEQMAX).fill(0) : a);
  }
  fs(n: number, s: string): string {
    const a = this.parse(s);
    let i = 1;
    while ((a[i] ?? 0) !== 0) i++;
    this.x = i;
    for (let k = 0; k < SEQMAX; k++) this.pm[k] = k;
    if (n === 0) a[this.x - 1] = 0;
    else this.ex(a, n);
    return this.out(a);
  }
  less(a: string, b: string): boolean {
    return seqCompare(a, b, this.bias) === '2';
  }
}

// ————————————————————————————————————————————————
//  二维矩阵
// ————————————————————————————————————————————————

export abstract class MatrixNotation extends Notation {
  /** 矩阵列容量（Bashicu 系 20，Row-Extend 系 40） */
  protected abstract readonly C: number;
  /** 列数推断方式：0=按第 2 行串长，1=按第 2 行末个非 0 列，2=不推断 */
  protected ymode = 0;
  /** 行内变长输出（Row-Extend 用） */
  protected varRow = false;

  protected m: number[] = new Array<number>(ROWMAX * 20).fill(0);

  protected mk(): number[] {
    return new Array<number>(ROWMAX * this.C).fill(0);
  }
  protected at(r: number, j: number): number {
    return this.m[r * this.C + j] ?? 0;
  }
  protected put(r: number, j: number, v: number): void {
    this.m[r * this.C + j] = v;
  }
  /** 该记号的展开规则 */
  protected abstract ex(n: number): void;

  /** limit 的默认实现：两行，第 2 行前 n 列填 1 */
  protected limitMat(n: number): string {
    this.m = this.mk();
    for (let i = 0; i < n; i++) this.put(1, i, 1);
    if (n === 0) return '(0)(0)';
    if (this.varRow) return maoutVar(this.m, this.C, 2);
    return maout(this.m, this.C, 2, n);
  }

  fsLimit(a: number): string {
    return this.limitMat(a);
  }
  typeOf(s: string): string {
    this.m = this.mk();
    return matrixType0(s, this.C, this.ymode, this.varRow);
  }
  pred(s: string): string {
    this.m = this.mk();
    return matrixPrecursor(s, this.C, this.ymode, 0, this.varRow);
  }
  fs(n: number, s: string): string {
    this.m = this.mk();
    const r = txma(s, this.C, this.ymode);
    this.m = r.m;
    this.x = r.rows;
    this.y = r.cols;
    if (n === 0) {
      if (this.varRow) return maoutVar(this.m, this.C, this.x - 1);
      return maout(this.m, this.C, this.x - 1, this.y);
    }
    this.ex(n);
    if (this.varRow) return maoutVar(this.m, this.C, this.x);
    return maout(this.m, this.C, this.x, this.y);
  }
  less(a: string, b: string): boolean {
    return matrixCompare(a, b, this.C, this.ymode);
  }
}

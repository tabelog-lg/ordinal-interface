/**
 * Bashicu Matrix（2 行 / 20 列，BMS 的基准实现）
 * 展开：找末行最右非零列的父行 pr，
 *       末行该列 -1、右侧补齐为父行对应值，
 *       之后复制 (x-1-pr) 行 n 次，每列按 asmt() 决定是否在落差上加 Δ
 */
import { MatrixNotation } from './core/notation';
import { ROWMAX } from './core/matrix';
import { bmsPar, bmsAsmt } from './core/bms';

export class BashicuMatrix extends MatrixNotation {
  override readonly name = 'Bashicu Matrix';
  protected override C = 20;
  protected override ymode = 0;

  protected override ex(n: number): void {
    const C = this.C;
    const delta = new Array<number>(24).fill(0);
    const w = new Array<number>(ROWMAX * C).fill(0);

    for (let r = 0; r < this.x; r++) for (let j = 0; j < this.y; j++) w[r * C + j] = this.at(r, j);

    let c0 = 0;
    while (this.at(this.x - 1, c0) !== 0) c0++; // 末行最右非零列 +1
    c0--;

    const pp = bmsPar((this.x - 1) * C + c0, (this.x - 1) * C + c0, C, this.m);
    const pr = Math.floor(pp / C);

    for (let j = 0; j < c0; j++) delta[j] = this.at(this.x - 1, j) - this.at(pr, j);

    const L = this.x - 1 - pr;
    if (this.x === 2 && this.y !== 1) this.y--; // 两行矩阵的列数收缩

    this.put(this.x - 1, c0, this.at(this.x - 1, c0) - 1);
    for (let j = c0 + 1; j < this.y; j++) this.put(this.x - 1, j, this.at(pr, j));

    for (let r = this.x; r <= n * L + this.x; r++)
      for (let j = 0; j < this.y; j++) {
        const v = this.at(r - L, j);
        const d = delta[j] ?? 0;
        const asc = bmsAsmt((r - L) * C + j, pr, (r - L) * C + j, C, this.m);
        this.put(r, j, d * asc + v);
      }
    this.x = n * L + this.x - 1;
  }
}

export const bashicuMatrix = new BashicuMatrix();
export default bashicuMatrix;

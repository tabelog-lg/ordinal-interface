/**
 * Stronf Bashicu Matrix
 * 先构造「差值矩阵」w[r][j] = max(m[r][j] - m[父行][j], 0)，
 * 复制时若末行末列位置未变则用 asmt 抬升，否则直接用差值矩阵累加。
 */
import { MatrixNotation } from './core/notation';
import { ROWMAX } from './core/matrix';
import { bmsPar, bmsAsmt } from './core/bms';

export class BmsStronf extends MatrixNotation {
  override readonly name = 'Stronf Bashicu Matrix';
  protected override C = 20;
  protected override ymode = 0;

  protected override ex(n: number): void {
    const C = this.C;
    const delta = new Array<number>(24).fill(0);
    const w = new Array<number>(ROWMAX * C).fill(0);

    // 差值矩阵：每位减去其所在行的父行的同列值（下界 0）
    for (let r = 1; r < this.x; r++) {
      if (this.at(r, 0) === 0) continue;
      const pp = bmsPar(r * C, r * C, C, this.m);
      const pr = Math.floor(pp / C);
      for (let j = 0; j < this.y; j++) {
        const d = this.at(r, j) - this.at(pr, j);
        w[r * C + j] = d < 0 ? 0 : d;
      }
    }

    let c0 = 0;
    while (this.at(this.x - 1, c0) !== 0) c0++;
    c0--;
    w[(this.x - 1) * C + c0] -= 1; // 末行末列先 -1

    const pp = bmsPar((this.x - 1) * C + c0, (this.x - 1) * C + c0, C, this.m);
    const pr = Math.floor(pp / C);

    let j2 = c0; // 父行中 >= 末行该值的最右列 +1
    while (j2 >= 0 && this.at(pr, j2) < this.at(this.x - 1, c0)) j2--;
    j2++;

    for (let j = 0; j < c0; j++) delta[j] = this.at(this.x - 1, j) - this.at(pr, j);

    const L = this.x - 1 - pr;
    if (this.x === 2 && this.y !== 1) this.y--;

    this.put(this.x - 1, c0, this.at(this.x - 1, c0) - 1);
    for (let j = c0 + 1; j < this.y; j++) this.put(this.x - 1, j, this.at(pr, j));

    for (let r = this.x; r <= n * L + this.x; r++)
      for (let j = 0; j < this.y; j++) {
        if (c0 === j2) {
          const v = this.at(r - L, j);
          const d = delta[j] ?? 0;
          const asc = bmsAsmt((r - L) * C + j, pr, (r - L) * C + j, C, this.m);
          this.put(r, j, d * asc + v);
        } else {
          this.put(r, j, w[(r - L) * C + j] + this.at(r - 1, j));
          w[r * C + j] = w[(r - L) * C + j];
        }
      }
    this.x = n * L + this.x - 1;
  }
}

export const bmsStronf = new BmsStronf();
export default bmsStronf;

/**
 * Parented Predecessor Matrix 00T
 * 同 PPM，但：不因 x==2 收缩列数；而是在末尾检查第 y+1 行，
 * 若其第 y-1 列为 0 则把列数收一档（00T 的 T = 尾部裁剪）。
 * limit 也不同：下三角矩阵，第 r 行前 r-1 列填 r。
 */
import { Ppm } from './ppm';
import { maout, ROWMAX } from './core/matrix';

export class Ppm00t extends Ppm {
  override readonly name = 'Parented Predecessor Matrix 00T';

  override fsLimit(a: number): string {
    this.m = new Array<number>(ROWMAX * this.C).fill(0);
    for (let r = 2; ; r++) {
      if (a + 2 < r) break;
      for (let j = 0; j < r - 1; j++) this.put(r, j, r);
    }
    return maout(this.m, this.C, a + 3, Math.max(a + 1, 1));
  }

  protected override ex(n: number): void {
    let nc = 0;
    while (this.at(this.x - 1, nc) !== 0) nc++;
    const c0 = nc - 1;
    const pr = this.at(this.x - 1, c0) - 1;
    const L = this.x - 1 - pr;

    this.descendOrFall(nc, c0, pr);

    for (let j = nc; this.at(pr, j) !== 0; j++)
      this.put(this.x - 1, j, this.at(pr, j) + this.at(this.x - 1, c0) - this.at(pr, c0));

    for (let r = this.x; r <= n * L + this.x; r++) this.copyRow(r, pr, c0, L);
    this.x = n * L + this.x - 1;
    if (this.at(this.y + 1, this.y - 1) === 0 && this.y !== 1) this.y--; // 尾部裁剪
  }
}

export const ppm00t = new Ppm00t();
export default ppm00t;

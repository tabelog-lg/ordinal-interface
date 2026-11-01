/**
 * Bashicu Matrix 4.1
 * 与标准 BMS 的差别：抬升判定 asmt() 多带两个参数——
 * 先取父行自身的父行作为目标，且只在该列的「上界」之上才抬升。
 */
import { MatrixNotation } from './core/notation';
import { ROWMAX } from './core/matrix';
import { bmsPar } from './core/bms';

export class Bm41 extends MatrixNotation {
  override readonly name = 'Bashicu Matrix 4.1';
  protected override C = 20;
  protected override ymode = 0;

  /** BM4.1 专用 asmt：col 之上才考虑抬升 */
  private asmt4(cellIdx: number, target: number, k: number, col: number): number {
    const C = this.C;
    const buf = new Array<number>(301).fill(0);
    if (col < k % C) return 1;
    if (this.m[cellIdx] === 0) return 0;
    let q = cellIdx;
    let c = 0;
    for (let guard = 0; 0 < q && this.m[q] !== 0 && guard < 10000; guard++) {
      q = bmsPar(q, k + (q - cellIdx), C, this.m);
      buf[c] = Math.floor(((q - cellIdx) + k) / C);
      if (this.m[q] === 0) {
        const v = Math.floor(((q - cellIdx) + k) / C);
        if (v !== target && -1 < v - target) return 0;
      }
      c++;
    }
    for (let i = c + 1; i >= 0; i--) if (target === buf[i]) return 1;
    return 0;
  }

  protected override ex(n: number): void {
    const C = this.C;
    const delta = new Array<number>(24).fill(0);
    const w = new Array<number>(ROWMAX * C).fill(0);

    for (let r = 0; r < this.x; r++) for (let j = 0; j < this.y; j++) w[r * C + j] = this.at(r, j);

    let c0 = 0;
    while (this.at(this.x - 1, c0) !== 0) c0++;
    c0--;

    const pp = bmsPar((this.x - 1) * C + c0, (this.x - 1) * C + c0, C, this.m);
    const pr = Math.floor(pp / C);

    let c1 = -1; // 父行的末列
    while (this.at(pr, c1 + 1) !== 0) c1++;
    const pp2 = bmsPar(pr * C + c1, pr * C + c1, C, this.m);
    const pr2 = Math.floor(pp2 / C);

    for (let j = 0; j < c0; j++) delta[j] = this.at(this.x - 1, j) - this.at(pr, j);

    const L = this.x - 1 - pr;
    if (this.x === 2 && this.y !== 1) this.y--;

    this.put(this.x - 1, c0, this.at(this.x - 1, c0) - 1);
    for (let j = c0 + 1; j < this.y; j++) this.put(this.x - 1, j, this.at(pr, j));

    for (let r = this.x; r <= n * L + this.x; r++)
      for (let j = 0; j < this.y; j++) {
        const v = this.at(r - L, j);
        const d = delta[j] ?? 0;
        const asc = this.asmt4((r - L) * C + j, pr2, (r - L) * C + j, c1);
        this.put(r, j, d * asc + v);
      }
    this.x = n * L + this.x - 1;
  }
}

export const bm41 = new Bm41();
export default bm41;

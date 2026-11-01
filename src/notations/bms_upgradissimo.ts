/**
 * Upgradissimo Bashicu Matrix
 * 差值矩阵就是原矩阵副本；抬升判定 asmt 换成递归版：
 * 先看右侧一列是否抬升，再看本列是否落在允许区间内。
 */
import { MatrixNotation } from './core/notation';
import { ROWMAX } from './core/matrix';
import { bmsPar } from './core/bms';

export class BmsUpgradissimo extends MatrixNotation {
  override readonly name = 'Upgradissimo Bashicu Matrix';
  protected override C = 20;
  protected override ymode = 0;

  /** 递归抬升判定 */
  private asmt5(cellIdx: number, target: number, k: number, c0: number, j2: number): number {
    const C = this.C;
    const buf = new Array<number>(301).fill(0);
    if (k % C < c0) {
      if (this.asmt5(cellIdx + 1, target, k + 1, c0, j2) === 1) return 1;
      if (k % C < j2) {
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
      return 1;
    }
    return 0;
  }

  protected override ex(n: number): void {
    const C = this.C;
    const delta = new Array<number>(24).fill(0);
    const w = new Array<number>(ROWMAX * C).fill(0);

    for (let r = 1; r < this.x; r++)
      if (this.at(r, 0) !== 0) for (let j = 0; j < this.y; j++) w[r * C + j] = this.at(r, j);

    let c0 = 0;
    while (this.at(this.x - 1, c0) !== 0) c0++;
    c0--;

    const pp = bmsPar((this.x - 1) * C + c0, (this.x - 1) * C + c0, C, this.m);
    const pr = Math.floor(pp / C);

    let j2 = c0;
    while (j2 >= 0 && this.at(pr, j2) < this.at(this.x - 1, c0)) j2--;
    j2++;

    for (let j = 0; j < c0; j++) delta[j] = this.at(this.x - 1, j) - this.at(pr, j);

    const L = this.x - 1 - pr;
    if (this.x === 2 && this.y !== 1) this.y--;

    this.put(this.x - 1, c0, this.at(this.x - 1, c0) - 1);
    for (let j = c0 + 1; j < this.y; j++) this.put(this.x - 1, j, this.at(pr, j));

    for (let r = this.x; r <= n * L + this.x; r++)
      for (let j = 0; j < this.y; j++) {
        const v = this.at(r - L, j);
        const d = delta[j] ?? 0;
        const asc = this.asmt5((r - L) * C + j, pr, (r - L) * C + j, c0, j2);
        this.put(r, j, d * asc + v);
      }
    this.x = n * L + this.x - 1;
  }
}

export const bmsUpgradissimo = new BmsUpgradissimo();
export default bmsUpgradissimo;

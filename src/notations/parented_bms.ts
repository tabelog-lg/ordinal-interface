/**
 * Parented Bashicu Matrix
 * 与 BMS 的差别：不用 par() 求父——末行末列的值本身就是父的行号。
 */
import { MatrixNotation } from './core/notation';
import { ROWMAX } from './core/matrix';

export class ParentedBms extends MatrixNotation {
  override readonly name = 'Parented Bashicu Matrix';
  protected override C = 20;
  protected override ymode = 0;

  protected override ex(n: number): void {
    const w = new Array<number>(ROWMAX * this.C).fill(0);
    for (let r = 0; r < this.x; r++)
      for (let j = 0; j < this.y; j++) w[r * this.C + j] = this.at(r, j);

    let c0 = 0;
    while (this.at(this.x - 1, c0) !== 0) c0++;
    c0--;

    const pr = this.at(this.x - 1, c0) - 1; // 父行号直接取自元素值
    const L = this.x - 1 - pr;

    if (this.x === 2 && this.y !== 1) this.y--;
    for (let j = c0; j < this.y; j++) this.put(this.x - 1, j, this.at(pr, j)); // 右侧补齐

    for (let r = this.x; r <= n * L + this.x; r++) {
      if ((r - pr) % L === 0) {
        // 提升行
        for (let j = 0; j < this.y; j++)
          this.put(r, j, j < c0 ? this.at(r - L, j) + L : this.at(r - L, j));
      } else {
        for (let j = 0; j < this.y; j++)
          this.put(
            r,
            j,
            this.at(r - L, j) < this.at(this.x - 1, c0) ? this.at(r - L, j) : this.at(r - L, j) + L,
          );
      }
    }
    this.x = n * L + this.x - 1;
  }
}

export const parentedBms = new ParentedBms();
export default parentedBms;

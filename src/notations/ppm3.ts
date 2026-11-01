/**
 * Parented Predecessor Matrix 3
 * 与 PPM 唯一差别：复制阶段提升行里，当父行该列值小于末行时，
 * 末列位置也一并抬升（即 condition 多一个 || 分支）。
 */
import { Ppm } from './ppm';

export class Ppm3 extends Ppm {
  override readonly name = 'Parented Predecessor Matrix 3';

  protected override copyRow(r: number, pr: number, c0: number, L: number): void {
    if ((r - pr) % L === 0) {
      for (let j = 0; j < this.y; j++) {
        // 与 PPM 的差别就在这一行
        if (j < c0 || (this.at(pr, c0) < this.at(this.x - 1, c0) && j === c0))
          this.put(r, j, this.at(r - L, j) + L);
        else this.put(r, j, this.at(r - L, j));
      }
    } else {
      for (let j = 0; j < this.y; j++)
        this.put(r, j, pr < this.at(r - L, j) ? this.at(r - L, j) + L : this.at(r - L, j));
    }
  }
}

export const ppm3 = new Ppm3();
export default ppm3;

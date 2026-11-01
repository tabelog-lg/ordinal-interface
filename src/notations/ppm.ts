/**
 * Parented Predecessor Matrix
 * 末行末列的值给出父行 pr；先判定末行该列是「降级」还是「回落到父值」，
 * 再把右侧按父行补齐，最后整块复制 n 次。
 */
import { MatrixNotation } from './core/notation';
import { ROWMAX } from './core/matrix';

export class Ppm extends MatrixNotation {
  readonly name: string = 'Parented Predecessor Matrix 2';
  protected override C = 20;
  protected override ymode = 0;

  /** 末元素：链上有同值则回落到父值，否则 -1。PPM3 只覆盖复制阶段，这里两者共用 */
  protected descendOrFall(nc: number, c0: number, pr: number): void {
    let descend = true;
    if (c0 < 1) {
      for (let r = this.x - 2; pr < r; r--) if (this.at(r, c0) === this.at(pr, c0)) descend = false;
    } else {
      let r = this.at(this.x - 1, nc - 2); // 沿倒数第二列的父链向上
      for (;;) {
        r = r - 1;
        if (!(pr < r)) break;
        if (this.at(r, c0) === this.at(pr, c0)) descend = false;
        r = this.at(r, nc - 2);
      }
    }
    if (descend) this.put(this.x - 1, c0, this.at(this.x - 1, c0) - 1);
    else this.put(this.x - 1, c0, this.at(pr, c0));
  }

  /** 复制阶段：提升行的处理由子类决定 */
  protected copyRow(r: number, pr: number, c0: number, L: number): void {
    if ((r - pr) % L === 0) {
      for (let j = 0; j < this.y; j++)
        this.put(r, j, j < c0 ? this.at(r - L, j) + L : this.at(r - L, j));
    } else {
      for (let j = 0; j < this.y; j++)
        this.put(r, j, pr < this.at(r - L, j) ? this.at(r - L, j) + L : this.at(r - L, j));
    }
  }

  protected override ex(n: number): void {
    const w = new Array<number>(ROWMAX * this.C).fill(0);
    for (let r = 0; r < this.x; r++)
      for (let j = 0; j < this.y; j++) w[r * this.C + j] = this.at(r, j);

    let nc = 0; // 末行非零列数
    while (this.at(this.x - 1, nc) !== 0) nc++;
    const c0 = nc - 1; // 末列
    const pr = this.at(this.x - 1, c0) - 1; // 父行
    const L = this.x - 1 - pr;

    if (this.x === 2 && this.y !== 1) this.y--;

    this.descendOrFall(nc, c0, pr);

    // 右侧按父行补齐（差值平移）
    for (let j = nc; this.at(pr, j) !== 0; j++)
      this.put(this.x - 1, j, this.at(pr, j) + this.at(this.x - 1, c0) - this.at(pr, c0));

    for (let r = this.x; r <= n * L + this.x; r++) this.copyRow(r, pr, c0, L);
    this.x = n * L + this.x - 1;
  }
}

export const ppm = new Ppm();
export default ppm;

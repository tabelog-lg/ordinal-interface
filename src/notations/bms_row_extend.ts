/**
 * Limited Row-Extending BMS (non-Ceiling-upgrade)
 * 与 Bashicu 的差别：
 *   * 矩阵 40 列（COLS=40），行内变长（输出遇到 0 即收尾）
 *   * 复制之后还要重建「父表」，按父表把每个元素重算成 父+1
 *     —— 这就是 row-extending：行会向右延伸
 */
import { MatrixNotation } from './core/notation';
import { ROWMAX } from './core/matrix';
import { bmsPar, bmsAsmt } from './core/bms';

export class BmsRowExtend extends MatrixNotation {
  override readonly name = 'Limited Row-Extending BMS (non-Ceiling-upgrade)';
  protected override C = 40;
  protected override ymode = 2;
  protected override varRow = true;

  protected override ex(n: number): void {
    const C = this.C;
    const delta = new Array<number>(44).fill(0);
    const last = new Array<number>(ROWMAX).fill(0);
    const pt = new Array<number>(ROWMAX * C).fill(0); // 父表

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
    this.put(this.x - 1, c0, this.at(this.x - 1, c0) - 1);
    for (let j = c0 + 1; j < C; j++) this.put(this.x - 1, j, this.at(pr, j));

    for (let r = this.x; r <= n * L + this.x; r++)
      for (let j = 0; j < C; j++) {
        const v = this.at(r - L, j);
        const d = delta[j] ?? 0;
        const asc = bmsAsmt((r - L) * C + j, pr, (r - L) * C + j, C, this.m);
        this.put(r, j, d * asc + v);
      }

    // ---- 重建父表 ----
    for (let r = 1; r < n * L + this.x - 1; r++)
      for (let j = 0; j < C; j++) {
        if (this.at(r, j) !== 0 && this.at(r, j + 1) === 0) last[r] = j;
        if (this.at(r, j) === 0) pt[r * C + j] = -1;
        else {
          const q = bmsPar(r * C + j, r * C + j, C, this.m);
          pt[r * C + j] = Math.floor(q / C);
        }
      }
    // ---- 行延伸：末列超过阈值时，右侧各列改挂到第 j2 列 ----
    for (let r = this.x; r < n * L + this.x - 1; r++) {
      if (j2 <= (last[r] ?? 0)) {
        for (let j = C - 1; j >= 0; j--) {
          if (j - c0 + j2 < 0) pt[r * C + j] = pt[r * C + 0];
          else pt[r * C + j] = pt[r * C + (j - c0 + j2)];
        }
      }
    }
    // ---- 按父表重算元素值 ----
    for (let r = this.x; r <= n * L + this.x; r++)
      for (let j = 0; j < C; j++) {
        if ((pt[r * C + j] ?? 0) < 0) this.put(r, j, 0);
        else this.put(r, j, this.at(pt[r * C + j], j) + 1);
      }
    this.x = n * L + this.x - 1;
  }
}

export const bmsRowExtend = new BmsRowExtend();
export default bmsRowExtend;

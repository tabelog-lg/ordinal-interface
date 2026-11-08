/**
 * Ultimately Idealized 0-Y Sequence（0-Y 的 non-lifting 变体）
 * 与 0-Y 的三点差别：
 *  1) 先单独给「末元素」定父：从 x-2 往前找第一个 a[j] < a[x-1] 且为祖先者
 *  2) 主循环里除 pare() 外还多一条「落差过小 / 位置过前」的排除条件，
 *     且 j==0 时无条件接受（即使 a[0] >= a[i]）
 *  3) 递归后祖先下标一律 +l，不再取 min —— 即不再做 lifting
 */
import { SeqNotation } from './core/notation';
import { SEQMAX, seqLimitTwo, pare } from './core/seq';

export class ZeroYSuperNonLifting extends SeqNotation {
  protected override usePm = true;
  override readonly name = 'Ultimately Idealized 0-Y Sequence';
  protected override bias = 0;
  protected override limitArr(n: number): number[] {
    return seqLimitTwo(n);
  }

  private exRec(a: number[], n: number): void {
    const g = (i: number) => a[i] ?? 0;
    const fb = new Array<number>(SEQMAX).fill(0);
    const an = new Array<number>(1002).fill(0);
    fb[0] = 1;
    an[0] = 0;

    // 1) 末元素的父
    for (let j = this.x - 2; ; j--) {
      if (j < 0) break;
      if (g(j) < g(this.x - 1) && pare(this.x - 1, j, this.pm) === 1) {
        fb[this.x - 1] = g(this.x - 1) - g(j);
        an[this.x - 1] = j;
        this.pm[this.x - 1] = j + 1;
        break;
      }
    }

    // 2) 其余位置的父
    for (let i = 1; ; i++) {
      if (this.x <= i) {
        this.l = this.x - 1 - an[this.x - 1];
        if (fb[this.x - 1] === 1) {
          for (let k = this.x - 1; k < this.l * n + this.x - 1; k++) a[k] = g(k - this.l);
        } else {
          this.exRec(fb, n);
          for (let k = this.x; k < this.l * n + this.x - 1; k++) an[k] = an[k - this.l] + this.l;
          for (let k = this.x - 1; k < this.l * n + this.x - 1; k++) a[k] = (fb[k] ?? 0) + g(an[k]);
        }
        return;
      }
      if (g(i) === 1) {
        fb[i] = 1;
        an[i] = -1;
        this.pm[i] = -1;
      } else {
        for (let j = i; j >= 0; j--) {
          let ok: boolean;
          if (g(j) < g(i)) {
            if (pare(i, j, this.pm) !== 1) ok = false;
            else if (g(i) - g(j) < fb[this.x - 1] && an[this.x - 1] < i) ok = false;
            else ok = true;
          } else {
            ok = j === 0; // 到头了就无条件接受
          }
          if (ok) {
            fb[i] = g(i) - g(j);
            an[i] = j;
            this.pm[i] = j + 1;
            break;
          }
        }
      }
    }
  }

  protected override ex(a: number[], n: number): void {
    this.exRec(a, n);
  }
}

export const zeroYSuperNonLifting = new ZeroYSuperNonLifting();
export default zeroYSuperNonLifting;

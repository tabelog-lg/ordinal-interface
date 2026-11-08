/**
 * 0-Y Sequence
 * 一维序列，元素为正整数（0 作结束哨兵，故不做 +1 偏移）。
 * Ex() 是递归的：先给每个位置求「父」(pm) 与到父的落差 (fb)，
 * 再对落差序列自身递归展开，最后把落差加回到祖先位置上。
 */
import { SeqNotation } from './core/notation';
import { SEQMAX, seqLimitTwo, pare } from './core/seq';

export class ZeroY extends SeqNotation {
  protected override usePm = true;
  override readonly name = '0-Y Sequence';
  protected override bias = 0;
  protected override limitArr(n: number): number[] {
    return seqLimitTwo(n);
  }

  private exRec(a: number[], n: number, depth = 0): void {
    const g = (i: number) => a[i] ?? 0;
    const fb = new Array<number>(SEQMAX).fill(0); // 到父的落差
    const an = new Array<number>(1002).fill(0); // 父下标
    fb[0] = 1;
    an[0] = 0;

    for (let i = 1; ; i++) {
      if (this.x <= i) {
        // 父表算完，开始真正的展开
        this.l = this.x - 1 - an[this.x - 1];
        if (fb[this.x - 1] === 1 || depth >= 64) {
          // 落差为 1：整段照抄
          for (let k = this.x - 1; k < this.l * n + this.x - 1; k++) a[k] = g(k - this.l);
        } else {
          // 否则先递归展开落差，再加回祖先
          this.exRec(fb, n, depth + 1);
          for (let k = this.x; k < this.l * n + this.x - 1; k++)
            an[k] =
              an[k - this.l] < an[this.x - this.l] ? an[k - this.l] : an[k - this.l] + this.l;
          for (let k = this.x - 1; k < this.l * n + this.x - 1; k++) a[k] = (fb[k] ?? 0) + g(an[k]);
        }
        return;
      }
      if (g(i) === 1) {
        // 最小值：父记为空
        fb[i] = 1;
        an[i] = -1;
        this.pm[i] = -1;
      } else {
        for (let j = i; j >= 0; j--) {
          let ok = false;
          if (g(j) < g(i)) ok = pare(i, j, this.pm) === 1;
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

export const zeroY = new ZeroY();
export default zeroY;

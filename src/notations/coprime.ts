/**
 * Coprime Series sequence
 * 先给每位求父（向前第一个更小值），再沿父链上溯到第一个与末元素
 * 「不互质」的位置，以它作为复制块的起点。
 * 注意 coprime() 的返回值语义与名字相反：返回 1 表示「有 >1 的公因子」。
 */
import { SeqNotation } from './core/notation';
import { seqLimitTwo } from './core/seq';

/** 返回 1 表示 a、b 不互素（gcd > 1）。gcd(0,b)=|b|，与数学定义一致。 */
function hasCommonFactor(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x > 1 ? 1 : 0;
}

export class Coprime extends SeqNotation {
  override readonly name = 'Coprime Series sequence';
  protected override bias = 0;
  protected override limitArr(n: number): number[] {
    return seqLimitTwo(n);
  }
  protected override ex(a: number[], n: number): void {
    const g = (i: number) => a[i] ?? 0;
    const fb = new Array<number>(1001).fill(0);
    fb[0] = 0;
    for (let i = 1; ; i++) {
      if (this.x <= i) {
        // 合法式以 1 开头，链走到第 0 项必因 gcd=1 停下。
        // 非标准输入可能在 fb[0]=0 上形成自环，导致函数永不返回 —— 加护栏。
        let k = fb[this.x - 1] ?? 0;
        for (let guard = 0; guard <= 1000; guard++) {
          if (hasCommonFactor(g(this.x - 1), g(k)) !== 1) break;
          const nk = fb[k] ?? 0;
          if (nk === k) break;
          k = nk;
        }
        this.l = this.x - 1 - k;
        const hi = g(this.x - 1);
        const lo = g(k);
        for (let j = this.x - 1; j < this.l * n + this.x - 1; j++) a[j] = hi - lo - 1 + g(j - this.l);
        return;
      }
      if (g(i) === 1) fb[i] = -1;
      else {
        for (let j = i; j >= 0; j--)
          if (g(j) < g(i)) {
            fb[i] = j;
            break;
          }
      }
    }
  }
}

export const coprime = new Coprime();
export default coprime;

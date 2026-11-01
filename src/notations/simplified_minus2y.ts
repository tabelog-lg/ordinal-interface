/**
 * Simplified -2-Y Sequence
 * 极简版：直接把末元素减 1，并向右填充 n 个位置。
 */
import { SeqNotation } from './core/notation';
import { seqLimitTwo } from './core/seq';

export class SimplifiedMinus2y extends SeqNotation {
  override readonly name = 'Simplified -2-Y Sequence';
  protected override bias = 0;
  protected override limitArr(n: number): number[] {
    return seqLimitTwo(n);
  }
  protected override ex(a: number[], n: number): void {
    const v = a[this.x - 1] ?? 0;
    for (let i = this.x - 1; i < this.x + n - 1; i++) a[i] = v - 1;
  }
}

export const simplifiedMinus2y = new SimplifiedMinus2y();
export default simplifiedMinus2y;

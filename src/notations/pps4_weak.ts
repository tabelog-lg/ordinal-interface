/**
 * weak Parented Predecessor Sequence 4
 * 降级扫描条件收紧为 a[c] == a[p]（比 PPS4 的 <= 更难命中，故更弱）。
 */
import { SeqNotation } from './core/notation';
import { DecMode, ppsEx } from './core/seq';

export class Pps4Weak extends SeqNotation {
  override readonly name = 'weak Parented Predecessor Sequence 4';
  protected override bias = 1;
  protected override ex(a: number[], n: number): void {
    ppsEx(a, n, this.x, DecMode.DEC_SCAN_EQ, false);
  }
}

export const pps4Weak = new Pps4Weak();
export default pps4Weak;

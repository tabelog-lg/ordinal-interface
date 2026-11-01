/**
 * second extremely weak Parented Predecessor Sequence 4
 * 降级扫描 == 且遇更小值直接跳到边界（扫描更容易中止，故更弱）。
 */
import { SeqNotation } from './core/notation';
import { DecMode, ppsEx } from './core/seq';

export class Pps4Second extends SeqNotation {
  override readonly name = 'second extremely weak Parented Predecessor Sequence 4';
  protected override bias = 1;
  protected override ex(a: number[], n: number): void {
    ppsEx(a, n, this.x, DecMode.DEC_SCAN_EQ_SKIP, true);
  }
}

export const pps4Second = new Pps4Second();
export default pps4Second;

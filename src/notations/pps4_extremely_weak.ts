/**
 * extremely weak Parented Predecessor Sequence 4
 * 同 second 版的降级方式，但复制阶段提升点不再额外抬升。
 */
import { SeqNotation } from './core/notation';
import { DecMode, ppsEx } from './core/seq';

export class Pps4ExtremelyWeak extends SeqNotation {
  override readonly name = 'extremely weak Parented Predecessor Sequence 4';
  protected override bias = 1;
  protected override ex(a: number[], n: number): void {
    ppsEx(a, n, this.x, DecMode.DEC_SCAN_EQ_SKIP, false);
  }
}

export const pps4ExtremelyWeak = new Pps4ExtremelyWeak();
export default pps4ExtremelyWeak;

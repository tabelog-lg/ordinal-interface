/**
 * Parented Predecessor Sequence 2
 * PPS 家族基线：末元素先按「是否与父同值」处理，再 -1 降级，然后分段复制。
 */
import { SeqNotation } from './core/notation';
import { DecMode, ppsEx } from './core/seq';

export class Pps2 extends SeqNotation {
  override readonly name = 'Parented Predecessor Sequence 2';
  protected override bias = 1;
  protected override ex(a: number[], n: number): void {
    ppsEx(a, n, this.x, DecMode.DEC_MINUS1, false);
  }
}

export const pps2 = new Pps2();
export default pps2;

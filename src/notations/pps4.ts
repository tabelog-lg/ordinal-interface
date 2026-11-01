/**
 * Parented Predecessor Sequence 4
 * 降级方式换成向下扫描：找到第一个 a[c] <= a[p] 的位置，末元素取 c+2。
 */
import { SeqNotation } from './core/notation';
import { DecMode, ppsEx } from './core/seq';

export class Pps4 extends SeqNotation {
  override readonly name = 'Parented Predecessor Sequence 4';
  protected override bias = 1;
  protected override ex(a: number[], n: number): void {
    ppsEx(a, n, this.x, DecMode.DEC_SCAN_LE, false);
  }
}

export const pps4 = new Pps4();
export default pps4;

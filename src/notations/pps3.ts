/**
 * Parented Predecessor Sequence 3
 * 与 PPS2 的差别只在复制阶段：提升点若末元素已降到父值则照抄，否则再抬 L。
 */
import { SeqNotation } from './core/notation';
import { DecMode, ppsEx } from './core/seq';

export class Pps3 extends SeqNotation {
  override readonly name = 'Parented Predecessor Sequence 3';
  protected override bias = 1;
  protected override ex(a: number[], n: number): void {
    ppsEx(a, n, this.x, DecMode.DEC_MINUS1, true);
  }
}

export const pps3 = new Pps3();
export default pps3;

/**
 * third weak Parented Predecessor Sequence 4
 * 降级同 weak 版（== 扫描），复制阶段带提升点再抬一档。
 */
import { SeqNotation } from './core/notation';
import { DecMode, ppsEx } from './core/seq';

export class Pps4Third extends SeqNotation {
  override readonly name = 'third weak Parented Predecessor Sequence 4';
  protected override bias = 1;
  protected override ex(a: number[], n: number): void {
    ppsEx(a, n, this.x, DecMode.DEC_SCAN_EQ, true);
  }
}

export const pps4Third = new Pps4Third();
export default pps4Third;

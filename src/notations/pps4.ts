/**
 * Parented Predecessor Sequence 4
 *
 * 2026-11-08：本文件已由 11/7 提供的第二份 exe.c 的复原实现取代。
 * 旧的复原版（扫描下界 a[p]-1、回退写在循环体内）与用户提供的 exe
 * 在命令 4 上有 53/546 条差异，已删除，不再保留为独立记号。
 *
 * 当前实现的 Ex() 降级扫描：
 *   for (c = a[x-1]-3; -1 < c; c--)      下界放宽到 0
 *   if (c == -1) a[x-1] = a[p]            「没命中就回退父值」移到循环外
 * 步骤 1（拉回父值）、步骤 3（按段复制）与整个协议外壳与旧版逐字相同。
 * name0() 打印 "Parented Predecessor Sequence 4"，与 id/文件名一致。
 *
 * 完整对照见 docs/pps4-v2.md 与 docs/pps4-v2-changes/。
 */
import { SeqNotation } from './core/notation';
import { DecMode, ppsEx } from './core/seq';

export class Pps4 extends SeqNotation {
  override readonly name = 'Parented Predecessor Sequence 4';
  protected override bias = 1;
  protected override ex(a: number[], n: number): void {
    ppsEx(a, n, this.x, DecMode.DEC_SCAN_LE_WIDE, false);
  }
}

export const pps4 = new Pps4();
export default pps4;

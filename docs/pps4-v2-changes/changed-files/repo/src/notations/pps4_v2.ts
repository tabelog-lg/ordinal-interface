/**
 * Parented Predecessor Sequence 4 —— 另一版本（2026-11-07 提供的 exe.c）。
 *
 * 与 pps4.ts 唯一差别在 Ex() 的「末元素降级」扫描：
 *   旧版：for (c = a[x-1]-3; a[p]-1 <= c; c--)，下界 a[p]-1，回退写在循环体内；
 *   本版：for (c = a[x-1]-3; -1 < c; c--)，下界放宽到 0，回退移到循环外。
 * 步骤 1（把末元素拉回父值）、步骤 3（按段复制）与整个协议外壳完全一致，
 * 因此命令 1/2/3/5 的输出与 pps4 逐字相同，只有命令 4（展开）不同。
 *
 * exe 里 name0() 打印的仍是 "Parented Predecessor Sequence 4"（与 pps4 同名），
 * 这里加后缀以便在记号列表里区分。
 */
import { SeqNotation } from './core/notation';
import { DecMode, ppsEx } from './core/seq';

export class Pps4V2 extends SeqNotation {
  override readonly name = 'Parented Predecessor Sequence 4 (v2)';
  protected override bias = 1;
  protected override ex(a: number[], n: number): void {
    ppsEx(a, n, this.x, DecMode.DEC_SCAN_LE_WIDE, false);
  }
}

export const pps4V2 = new Pps4V2();
export default pps4V2;

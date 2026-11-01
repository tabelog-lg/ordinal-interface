/**
 * Parented Primitive Sequence System
 * 一维序列，内部 +1 存储（0 留给结束哨兵），输出时 -1。
 * 展开即最朴素的 PrSS：以末元素的值定父，整段复制 n 次，提升点抬 L。
 */
import { SeqNotation } from './core/notation';

export class PrssParented extends SeqNotation {
  override readonly name = 'Parented Primitive Sequence System';
  protected override bias = 1;
  protected override ex(a: number[], n: number): void {
    const g = (i: number) => a[i] ?? 0;
    const p = g(this.x - 1) - 2; // 父下标
    const L = this.x - 1 - p; // 段长
    for (let c = 0; c < n; c++)
      for (let j = 0; j < L; j++) {
        const i = this.x - 1 + c * L + j;
        if ((i - p) % L === 0) a[i] = g(i - L);
        // 提升点：照抄上一段
        else a[i] = g(i - L) + L; // 其余抬 L
      }
  }
}

export const prssParented = new PrssParented();
export default prssParented;

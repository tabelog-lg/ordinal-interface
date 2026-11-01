/**
 * MFSS —— Multiple Father Sequence System
 * 序列里每个值可以出现多次；展开时要求连续凑够 md 个「次大值」才定位父。
 * md 是编译期常量（反编译未给出初值，此处取 2；exe 启动时 name0 会打印它）。
 */
import { SeqNotation } from './core/notation';
import { seqLimitExact } from './core/seq';

const MD = 2;

export class Mfss extends SeqNotation {
  override readonly name = `Multiple Father Sequence System (${MD} fathers)`;
  protected override bias = 1;
  protected override limitArr(n: number): number[] {
    return seqLimitExact(n, this.bias);
  }
  protected override ex(a: number[], n: number): void {
    const g = (i: number) => a[i] ?? 0;
    let c = -1;
    let cnt = 0;
    // 从右往左找第 MD 个等于 a[x-1]-1 的位置
    for (let i = this.x - 1; i >= 0 && c === -1; i--) {
      if (g(i) === g(this.x - 1) - 1) {
        if (cnt === MD - 1) c = i;
        else cnt++;
      }
    }
    if (c === -1) {
      // 不够 MD 个：退化为取最后一个
      for (let i = 0; i < this.x; i++) if (g(i) === g(this.x - 1) - 1) c = i;
    }
    const L = this.x - 1 - c;
    for (let i = this.x - 1; i < n * L + this.x - 1; i++) a[i] = g(i - L);
    this.x = n * L + this.x - 1;
  }
}

export const mfss = new Mfss();
export default mfss;

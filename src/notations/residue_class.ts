/**
 * Residue Class Sequence
 * 与 Coprime 类似地求父链；但复制起点要额外满足：
 * 该祖先起 len 个位置覆盖了所有模 delta 的余数类（intd 全 1）。
 * 末元素的最终取值由未出现的余数类个数决定。
 */
import { SeqNotation } from './core/notation';
import { seqLimitTwo } from './core/seq';

/** 数组 p 从下标 0 起是否出现余数 k (mod delta) */
function intd(p: number[], k: number, delta: number): number {
  for (let c = 0; ; c++) {
    const v = p[c] ?? 0;
    if (v === 0) return 0;
    if (k === v % delta) break;
  }
  return 1;
}

export class ResidueClass extends SeqNotation {
  override readonly name = 'Residue Class Sequence';
  protected override bias = 0;
  protected override limitArr(n: number): number[] {
    return seqLimitTwo(n);
  }
  protected override ex(a: number[], n: number): void {
    const g = (i: number) => a[i] ?? 0;
    const fb = new Array<number>(1003).fill(0);
    fb[0] = -1;
    for (let i = 1; i < this.x; i++) {
      if (g(i) === 1) fb[i] = -1;
      else {
        for (let j = i; j >= 0; j--)
          if (g(j) < g(i)) {
            fb[i] = j;
            break;
          }
      }
    }

    const delta = g(this.x - 1) - g(fb[this.x - 1]);
    let ok = 0;
    let k = fb[this.x - 1] ?? 0;
    while (k !== -1) {
      // 沿父链找一个余数类齐全的祖先
      ok = 1;
      for (let c = 0; c < delta; c++) ok *= intd(a.slice(k), c, delta);
      if (ok === 1) break;
      k = fb[k] ?? 0;
    }

    let r = 1 - delta;
    for (;;) {
      // 统计沿链缺失的余数类
      let j = this.x - 1;
      while (j >= 0 && g(j) % delta !== r + delta) j = fb[j] ?? 0;
      if (j === -1) break;
      r++;
    }
    if (k === -1) r = g(this.x - 1) - r;
    else r = g(this.x - 1) - g(k);

    this.l = this.x - 1 - k;
    a[this.x - 1] = g(this.x - 1) - 1;
    for (let i = this.x; i < this.l * n + this.x - 1; i++) a[i] = r - 1 + g(i - this.l);
  }
}

export const residueClass = new ResidueClass();
export default residueClass;

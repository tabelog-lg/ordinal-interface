/**
 * HIUN —— Hierarchial Increase Unit Notation
 * 把序列压缩成「值 + 连续出现次数」的游程表(fd / cnt / pos)，
 * 再按层级向上找够 span 层的祖先，作为复制起点。
 */
import { SeqNotation } from './core/notation';

/** [s,e] 内不存在比 a[s] 更小的值 */
function minbtw(a: number[], s: number, e: number): number {
  const g = (i: number) => a[i] ?? 0;
  for (let c = s + 1; ; c++) {
    if (e < c) return 1;
    if (!(g(s) <= g(c))) break;
  }
  return 0;
}
/** [s,e] 内不存在比 a[e] 更大的值 */
function maxbtw(a: number[], s: number, e: number): number {
  const g = (i: number) => a[i] ?? 0;
  for (let c = e - 1; ; c--) {
    if (c < s) return 1;
    if (!(g(c) <= g(e))) break;
  }
  return 0;
}

export class Hiun extends SeqNotation {
  override readonly name = 'Hierarchial Increase Unit Notation';
  protected override bias = 0;
  protected override ex(a: number[], n: number): void {
    const g = (i: number) => a[i] ?? 0;
    const fd = new Array<number>(1003).fill(0);
    const cnt = new Array<number>(500).fill(0);
    const pos = new Array<number>(500).fill(0);

    let top = 0;
    fd[0] = 1;
    cnt[0] = 1;
    for (let i = 1; i < this.x; i++) {
      if (g(i) === g(i - 1) + 1) {
        cnt[top]++; // 同一层的连续递增合成一个游程
      } else {
        top++;
        fd[top] = g(i);
        cnt[top] = 1;
        pos[top] = i;
      }
    }

    let lo: number, span: number, k: number, hi: number;
    if (cnt[top] === 1) {
      let t = top;
      // 原程序没有 t>=0 这道护栏（会读到数组之前的内存，属未定义行为）
      while (t >= 0 && fd[top] <= fd[t]) t--;
      if (t < 0) t = -1;
      lo = fd[t] ?? 0; // t 可能为 -1（原程序在此越界读）
      hi = (fd[top] ?? 0) - (fd[t] ?? 0) + 1;
      k = t;
      span = (fd[top] ?? 0) - (fd[t] ?? 0);
    } else {
      lo = fd[top];
      span = cnt[top] - 1;
      k = top;
      hi = cnt[top] - 1;
    }

    let start: number;
    if (span === 1) {
      let j = this.x - 2;
      while (g(this.x - 1) <= g(j)) j--;
      start = j;
    } else if (k === 0) {
      start = 0;
    } else {
      start = 1;
      while (start < span) {
        let t = k - 1;
        for (;;) {
          let take: boolean;
          if (t < 0) take = false;
          else if (fd[t] < lo && cnt[t] <= hi) {
            if (minbtw(a, pos[t], pos[k]) !== 1) take = false;
            else if (hi <= cnt[t]) {
              if (lo - fd[t] < span) take = maxbtw(a, pos[t], pos[hi + k - 1]) === 1;
              else take = false;
            } else take = true;
          } else take = false;

          if (!take) {
            t--;
            continue;
          }
          if (start === 1) {
            let u = 1;
            while (minbtw(a, pos[u + t], this.x - 1) === 0) u++;
            start = pos[u + t];
          }
          lo = fd[t];
          hi = cnt[t];
          k = t;
          break;
        }
        if (t === -1) {
          start = 0;
          break;
        }
        start++;
      }
    }

    const L = this.x - 1 - start;
    const hi2 = g(this.x - 1);
    const lo2 = g(start);
    for (let j = this.x - 1; j < n * L + this.x - 1; j++) a[j] = hi2 - lo2 - 1 + g(j - L);
  }
}

export const hiun = new Hiun();
export default hiun;

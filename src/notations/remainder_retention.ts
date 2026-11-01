/**
 * Remainder Retention Sequence System
 *
 * ※ 本 exe 与其余记号不同：txar()/arout() 都从下标 1 开始
 *   （下标 0 恒为 0，只作占位），且输出用空格分隔而不是逗号。
 *   序列每位存一个 (商, 余数)：a[i] = a[父] * 商 + 余数，
 *   展开时保留余数、只累加商，这就是 "remainder retention"。
 */
import { Notation } from './core/notation';
import { SEQMAX, txar1, arout1, seqCompare1 } from './core/seq';

interface QR {
  q: number; // 商
  r: number; // 余数
}
/** pair 的字典序比较（先比商再比余数） */
function lessQR(x: QR, y: QR): boolean {
  return x.q !== y.q ? x.q < y.q : x.r < y.r;
}

export class RemainderRetention extends Notation {
  override readonly name = 'Remainder Retention Sequence System';
  override readonly description = '1 起址、空格分隔；(商,余数) 表示';

  /** 第 a 项 = "1 a+1"（1 起址 + 空格分隔）：(0) 1 1  (1) 1 2  (2) 1 3 */
  fsLimit(a: number): string {
    const b = new Array<number>(SEQMAX).fill(0);
    b[1] = 1;
    b[2] = a + 1;
    return arout1(b);
  }

  override typeOf(s: string): string {
    const a = txar1(s);
    let n = 1;
    while ((a[n] ?? 0) !== 0) n++;
    if ((a[1] ?? 0) === 0) return '1';
    if ((a[n - 1] ?? 0) === 1) return '2';
    return '3';
  }

  override pred(s: string): string {
    const a = txar1(s);
    let n = 1;
    while ((a[n] ?? 0) !== 0) n++;
    a[n - 1] = 0;
    return arout1(a);
  }

  override fs(n: number, seq: string): string {
    const a = txar1(seq);
    let i = 1;
    while ((a[i] ?? 0) !== 0) i++;
    this.x = i;
    if (n === 0) a[this.x - 1] = 0;
    else this.ex(a, n);
    return arout1(a);
  }

  override less(a: string, b: string): boolean {
    return seqCompare1(a, b) === '2';
  }

  private ex(a: number[], n: number): void {
    const g = (i: number) => a[i] ?? 0;
    const par = new Array<number>(1000).fill(0);
    const pr: QR[] = new Array(5000).fill(null).map(() => ({ q: 0, r: 0 }));

    this.x = this.x - 1; // 末位下标
    a[this.x] = g(this.x) - 1; // 末元素 -1
    pr[1] = { q: 1, r: 0 }; // 首位：商 1 余 0

    // 父 = 前面最后一个 <= 自己的位置；同时记下 (商, 余)
    for (let i = 2; i <= this.x; i++)
      for (let j = 1; j < i; j++)
        if (g(j) <= g(i)) {
          par[i] = j;
          pr[i] = { q: Math.trunc(g(i) / g(j)), r: g(i) % g(j) };
        }

    // 沿父链上溯，直到 (商,余) 不再变小
    let k = par[this.x];
    while (k !== 0 && lessQR(pr[this.x], pr[k])) k = par[k];
    const base = k;

    const diff = pr[this.x].q - pr[base].q;
    // ★ 复制段是 [base+1, x]，段长 L = x - base；共复制 n-1 轮。
    //   新下标 i 与源下标 j 的间距恒为 c*L（与段内位置无关），
    //   所以父指针平移 (i - j) 即可。
    //   反编译产物里这一处的下标推算不可靠，按源 exe 实测
    //   （"1 2" 的基本列 = 1 / 1 1 / 1 1 1 / 1 1 1 1 ...）定此处。
    let i = this.x;
    for (let c = 1; c < n; c++)
      for (let j = base + 1; j <= this.x; j++) {
        i++;
        par[i] = par[j] + (i - j);
        pr[i] = { q: pr[j].q + diff * c, r: pr[j].r };
        a[i] = g(par[i]) * pr[i].q + pr[i].r;
      }
    this.x = i - 2;
  }
}

export const remainderRetention = new RemainderRetention();
export default remainderRetention;

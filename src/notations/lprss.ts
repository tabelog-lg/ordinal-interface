/**
 * Long Primitive Sequence System（原 LPrSS.exe，VB.NET 反编译产物）
 *
 * 与 Simplified Primitive Sequence 是同一套展开规则，只是把 hydra 的括号串
 * 换成「逗号分隔整数」，因此元素值可以任意大（这就是 "Long"）：
 * limit(n) = "1,n+1"，空序列写作 "0"。
 *
 * 原程序把整数解析成数组再做 PrSS 展开（Function2 / Function4 / Function3），
 * 只有 type0 和 precursor 直接按字符串处理。
 */
import { Notation } from './core/notation';
import { vmid } from './core/vb';

/** Function2："1,2,3" -> [1,2,3]（"0" 是空序列） */
function parse(s: string): number[] {
  if (s === '0') return [];
  let count = 0;
  for (let i = 1; i <= s.length; i++) if (vmid(s, i, 1) === ',') count++;

  const a = new Array<number>(count + 1).fill(0);
  let start = 1;
  let scan = 1;
  for (let k = 0; k < a.length; k++) {
    while (!(s.length < scan || vmid(s, scan, 1) === ',')) scan++;
    a[k] = Number.parseInt(vmid(s, start, scan - start), 10);
    if (Number.isNaN(a[k])) a[k] = 0;
    scan++;
    start = scan;
  }
  return a;
}

/** Function3：数组 -> 字符串（空序列输出 "0"） */
function render(a: number[]): string {
  if (a.length === 0) return '0';
  return a.join(',');
}

/**
 * Function4：PrSS 展开 —— 向左找第一个小于末元素的作为父，
 * 以它为界取段长 L，复制段并逐段累加 delta = 末元素 - 父 - 1。
 */
function expandArr(n: number, b: number[]): number[] {
  if (b.length === 0) return b;
  const last = b[b.length - 1];
  let i = b.length - 2;
  while (i >= 0 && b[i] >= last) i--;
  // 末元素已是最小值：原 VB 程序在此越界抛异常，这里返回原序列兜底
  if (i < 0) return b.slice();

  const delta = last - b[i] - 1;
  const L = b.length - i - 1; // 段长

  const r = new Array<number>(b.length + L * n - 2 + 1).fill(0);
  for (let k = 0; k <= b.length - 2; k++) r[k] = b[k];
  for (let j = b.length - 1; j <= r.length - 1; j++) r[j] = r[j - L] + delta;
  return r;
}

export class Lprss extends Notation {
  override readonly name = 'Long Primitive Sequence System';
  override readonly description = '逗号分隔整数，元素值可任意大';

  fsLimit(a: number): string {
    return '1,' + (a + 1);
  }

  override typeOf(a: string): string {
    if (a === '0') return '1';
    if (a === '1') return '2';
    if (vmid(a, a.length - 1, 2) === ',1') return '2';
    return '3';
  }

  override pred(a: string): string {
    if (a === '1') return '0';
    return vmid(a, 1, a.length - 2);
  }

  override fs(n: number, b: string): string {
    return render(expandArr(n, parse(b)));
  }

  /** Function5：字典序比较 */
  override less(a: string, b: string): boolean {
    const A = parse(a);
    const B = parse(b);
    let i = 0;
    for (;;) {
      if (B.length === i) return false;
      if (A.length === i) return true;
      if (A[i] < B[i]) return true;
      if (A[i] > B[i]) return false;
      i++;
    }
  }
}

export const lprss = new Lprss();
export default lprss;

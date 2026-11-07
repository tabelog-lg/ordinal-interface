/**
 * STOS —— Single Transfinity Ordinal Sequence
 * 序列里允许 'w'（内部记作 -1）作为 transfinity 标记：
 *   * 末元素 < 1（即 w）时：先抄前半段，再用递增正整数「顶」上去，
 *     然后按 len = 2L+top-1 的布局在两端补 -1
 *   * 否则按常规复制块
 * 最后统一清理形如 [.. x, x-1, -1 ..] 的可消去片段。
 */
import { SeqNotation } from './core/notation';
import { SEQMAX, atoiAt } from './core/seq';

/** 解析器：'w' -> -1（吃掉 "w," 两个字符），其余按整数读 */
function txarSTOS(s: string): { a: number[]; n: number } {
  const buf = new Array<number>(501).fill(0);
  const len = s.length;
  let n = 0;
  for (let i = 0; i < len && n < SEQMAX; ) {
    if (s[i] === 'w') {
      buf[n++] = -1;
      i += 2;
    } else {
      const v = atoiAt(s, i);
      buf[n++] = v;
      i += v > 0 ? Math.trunc(Math.log10(v * 100 + 1)) : 2;
    }
  }
  return { a: buf, n };
}

/** 输出：<1 打印 w；w 后面还有元素时仍打逗号 */
function aroutSTOS(a: number[]): string {
  const g = (i: number) => a[i] ?? 0;
  if (g(0) === 0) return '0';
  let out = '';
  for (let i = 0; g(i) !== 0; i++) {
    if (g(i + 1) === 0 || g(i) < 1) {
      if (g(i + 1) === 0 || g(i) > -1) {
        out += g(i) < 1 ? 'w' : String(g(i));
        out += '\n';
      } else {
        out += 'w,';
      }
    } else {
      out += String(g(i)) + ',';
    }
  }
  return out.replace(/\n$/, '');
}

function dlt(a: number[], i: number): void {
  for (let c = i; c < 500; c++) a[c] = a[c + 1] ?? 0;
}

/** i 右侧第一个非负值 <= a[i] ? */
function po(a: number[], i: number): boolean {
  const g = (k: number) => a[k] ?? 0;
  let c = i;
  do {
    c++;
  } while (g(c) < 0);
  return g(c) <= g(i);
}

export class Stos extends SeqNotation {
  override readonly name = 'Single Transfinity Ordinal Sequence';
  override readonly description = "含 'w'（transfinity）标记的序列";
  protected override bias = 0;

  override fsLimit(a: number): string {
    // 原程序直接拼字符串 "1,w,w,...,w"（与 seqLimit 一样带 off-by-one）
    let out = '1,';
    for (let i = 1; ; i++) {
      if (a + 1 < i) break;
      out += 'w,';
    }
    return out.slice(0, -1);
  }

  protected override parse(s: string): number[] {
    const r = txarSTOS(s);
    this.x = r.n;
    return r.a;
  }
  protected override out(a: number[]): string {
    return aroutSTOS(a);
  }

  /** STOS 有自己的解析器（'w' -> -1），不能复用基类的 seqType0 */
  override typeOf(s: string): string {
    const a = txarSTOS(s).a;
    let n = 0;
    while ((a[n] ?? 0) !== 0) n++;
    return (a[0] ?? 0) === 0 ? '1' : (a[n - 1] ?? 0) === 1 ? '2' : '3';
  }

  override pred(s: string): string {
    const a = this.parse(s);
    let n = 1;
    while ((a[n] ?? 0) !== 0) n++;
    this.x = n;
    a[n - 1] = 0;
    return this.out(this.x === 1 ? new Array<number>(SEQMAX).fill(0) : a);
  }

  override less(a: string, b: string): boolean {
    const bufA = new Array<number>(502).fill(0);
    const p = txarSTOS(a);
    const na = p.n;
    for (let i = 0; (p.a[i] ?? 0) !== 0; i++) bufA[i] = p.a[i];
    for (let c = na - 1; c > 0; c--)
      if ((bufA[c + 1] ?? 0) === -1 && (bufA[c - 1] ?? 0) === (bufA[c] ?? 0) - 1) dlt(bufA, c);

    const q = txarSTOS(b);
    const nb = q.n;
    for (let c = nb - 1; c > 0; c--)
      if ((q.a[c + 1] ?? 0) === -1 && (q.a[c - 1] ?? 0) === (q.a[c] ?? 0) - 1) dlt(q.a, c);

    let i = 0;
    // 同 seqCompare：原程序靠越界读终止，这里显式给上界
    while (i < 502 && (bufA[i] ?? 0) === (q.a[i] ?? 0)) i++;
    if (i >= 502) return false;
    const av = bufA[i] ?? 0;
    const bv = q.a[i] ?? 0;
    return (av === -1 || bv <= av) && bv !== -1 ? false : true;
  }

  protected override ex(a: number[], n: number): void {
    const g = (i: number) => a[i] ?? 0;
    const fb = new Array<number>(1001).fill(0);

    let i = this.x;
    if (g(this.x - 1) < 1) {
      do {
        i--;
      } while (i >= 0 && g(i) === -1);
    } else {
      do {
        do {
          i--;
        } while (i >= 0 && g(this.x - 1) <= g(i));
      } while (i >= 0 && g(i) < 0);
    }
    const L = this.x - 1 - i;
    let len: number;

    if (g(this.x - 1) < 1) {
      // transfinity 分支
      for (let j = 0; j <= i; j++) fb[j] = g(j);
      let j: number;
      for (j = i + 1; j <= n + i; j++) fb[j] = (fb[j - 1] ?? 0) + 1;
      const top = j - 1;
      fb[L + top - 1] = fb[top] ?? 0;
      let k = 1;
      for (;;) {
        if (L <= k) break;
        fb[k + L + top - 1] = -1;
        fb[L + top - 1 - k] = -1;
        k++;
      }
      len = k + L + top - 1;
      for (let j2 = 0; j2 < 500; j2++) a[j2] = 0;
      for (let j2 = 0; j2 < 500; j2++) a[j2] = fb[j2] ?? 0;
    } else {
      // 常规复制
      for (let j = this.x - 1; j < n * L + this.x - 1; j++) a[j] = g(j - L);
      len = n * L + this.x - 1;
    }

    // 清理：a[j+1] == -1 且 a[j-1] == a[j]-1 且 po() 成立则删掉该位
    for (let j = len; j > 0; j--)
      if (g(j + 1) === -1 && g(j - 1) === g(j) - 1 && po(a, j)) dlt(a, j);
  }
}

export const stos = new Stos();
export default stos;

/**
 * Simplified Pair Sequence（原 PSS Hydra.exe，VB.NET 反编译产物）
 *
 * 序列写成 "0(1(2()))" 这种嵌套串：每个元素是一个十进制数后跟 '('，
 * 闭合括号统一堆在末尾 —— limit(n) = "0(1(2(...n())))"。
 *
 * 展开分两种情形：
 *   * 末元素值 > 0：向左扫，用括号深度计数找到「值 >= 末元素」的祖先作为父，
 *     把「父元素 + 其后内容」复制 n+1 份，再补上末尾的闭合括号；
 *   * 末元素值 == 0：按括号配对直接找父，片段末尾补一个 ')'。
 */
import { Notation } from './core/notation';
import { vmid, vasc, vmidInt } from './core/vb';

export class PssHydra extends Notation {
  override readonly name = 'Simplified Pair Sequence';
  override readonly description = '嵌套串，"数(" 形式。"0(1(2()))"';

  fsLimit(a: number): string {
    let r = '';
    for (let i = 0; i <= a; i++) r += String(i) + '(';
    for (let j = 0; j <= a; j++) r += ')';
    return r;
  }

  override typeOf(a: string): string {
    if (a === '0') return '1';
    return vmid(a, a.length - 1, 1) === '(' ? '2' : '3';
  }

  override pred(a: string): string {
    if (a === '0()') return '0';
    return vmid(a, 1, a.length - 3);
  }

  override fs(n: number, s: string): string {
    const L = s.length;
    let i1 = L - 2;
    while (i1 > 0 && vmid(s, i1, 1) === ')') i1--; // 跳过尾部闭合，落到最后一个 '('
    const i7 = i1;

    i1--; // 再跳过末元素的数字
    while (i1 > 0 && vasc(vmid(s, i1, 1)) > 45) i1--;
    i1++;

    const v = vmidInt(s, i1, i7 - i1); // 末元素的值
    const i2 = i1; // 末元素数字的起始位置

    let out = '';
    if (v > 0) {
      let i4 = 0; // 候选父的值
      let i5 = 0; // 括号深度计数
      while (i5 <= i4 && i1 > 1) {
        i1--;
        const c = vmid(s, i1, 1);
        if (c === '(') {
          i5++;
          if (i5 > i4) {
            const i6 = i1;
            i1--;
            while (i1 > 0 && vasc(vmid(s, i1, 1)) > 45) i1--;
            i1++;
            i4 = vmidInt(s, i1, i6 - i1);
            i4 = i4 < v ? 0 : i5; // 值不够大就继续往左找
          }
        } else if (c === ')') {
          i5--;
        }
      }
      const seg = vmid(s, i1, i2 - i1); // 从父开始、到末元素之前
      out = vmid(s, 1, i1 - 1);
      for (let k = 0; k <= n; k++) out += seg;
      const tail = vmid(s, L - i5 + 1, i5); // 末尾的 i5 个闭合
      for (let k = 1; k <= n; k++) out += tail;
      out += vmid(s, i7 + 2, L - i7 - 1);
    } else {
      let t = 1; // 按括号配对找父
      while (t > 0 && i1 > 0) {
        i1--;
        const c = vmid(s, i1, 1);
        if (c === '(') t--;
        else if (c === ')') t++;
      }
      i1--;
      while (i1 > 0 && vasc(vmid(s, i1, 1)) > 45) i1--;
      i1++;
      const seg = vmid(s, i1, i2 - i1) + ')';
      out = vmid(s, 1, i1 - 1);
      for (let k = 0; k <= n; k++) out += seg;
      out += vmid(s, i7 + 3, L - i7 - 2);
    }
    return out;
  }

  /** Function4：逐个元素比数值 */
  override less(a: string, b: string): boolean {
    let i = 3; // 跳过首元素 "0("
    for (;;) {
      if (i > b.length) return false;
      if (i > a.length) return true;
      if (vmid(a, i, 1) === ')') {
        // a 这一位已经结束
        if (vmid(b, i, 1) === ')') {
          i++;
          continue;
        }
        return true;
      }
      if (vmid(b, i, 1) === ')') return false;

      // 两边都还是数字：各读一个元素值
      let k = i;
      while (k <= a.length && vmid(a, k, 1) !== '(') k++;
      const va = vmidInt(a, i, k - i);
      k = i;
      while (i <= b.length && vmid(b, i, 1) !== '(') i++;
      const vb = vmidInt(b, k, i - k);

      if (va < vb) return true;
      if (va > vb) return false;
      i++;
    }
  }
}

export const pssHydra = new PssHydra();
export default pssHydra;

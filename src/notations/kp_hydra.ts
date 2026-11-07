/**
 * Simplified Primitive Sequence（原 KP Hydra.exe，VB.NET 反编译产物）
 *
 * 序列用纯括号串表示：每个 '(' 是一个元素，嵌套深度就是元素的值 ——
 *   "()" = [1]   "(())" = [1,2]   "((()))" = [1,2,3]
 *
 * 展开规则：向左找到末元素的父（它左边那个 '('），把「父 + 一个闭合」当作
 * 片段复制 n+1 份：第 1 份替换掉原来的末元素，其余 n 份追加。
 *
 * 字符串处理全部走 VB 的 1-based Strings.Mid，见 core/vb.ts。
 */
import { Notation } from './core/notation';
import { vmid } from './core/vb';

export class KpHydra extends Notation {
  override readonly name = 'Simplified Primitive Sequence';
  override readonly description = '括号串，嵌套深度 = 元素值。"((()))" = 1,2,3';

  fsLimit(a: number): string {
    let r = '';
    for (let i = 0; i <= a + 1; i++) r += '(';
    for (let j = 0; j <= a + 1; j++) r += ')';
    return r;
  }

  override typeOf(a: string): string {
    if (a === '0') return '1';
    // Mid(s, s.Length - 1, 1)：倒数第二个字符。是 '(' 说明末元素是叶子 -> 后继
    return vmid(a, a.length - 1, 1) === '(' ? '2' : '3';
  }

  override pred(a: string): string {
    if (a === '' || a === '0' || a === '()') return '0';
    return vmid(a, 1, a.length - 2);
  }

  override fs(n: number, s: string): string {
    // 零 / 后继没有基本列；不短路会拼出 ")" 这类不平衡串
    if (this.typeOf(s) !== '3') return s === '0' ? '0' : s;
    const L = s.length;
    let i1 = L - 2; // 从倒数第二个字符起
    while (i1 > 0 && vmid(s, i1, 1) === ')') i1--; // 向左跳过闭合，落到最后一个 '('
    let i2 = i1;
    let i3 = 1;
    while (i3 > 0 && i2 > 1) {
      // 括号配对，找到它左边的父 '('
      i2--;
      if (vmid(s, i2, 1) === ')') i3++;
      else i3--;
    }
    const seg = vmid(s, i2, i1 - i2) + ')'; // 父副本 + 闭合
    let out = vmid(s, 1, i2 - 1); // 前缀
    for (let k = 0; k <= n; k++) out += seg;
    return out + vmid(s, i1 + 3, L - i1 - 2);
  }

  /** 逐字符比较：'(' 小于 ')' */
  override less(a: string, b: string): boolean {
    let i = 2; // 跳过第 1 个字符（恒为 '('）
    for (;;) {
      if (i > b.length) return false;
      if (i > a.length) return true;
      if (vmid(a, i, 1) === '(' && vmid(b, i, 1) === ')') return false;
      if (vmid(b, i, 1) === '(' && vmid(a, i, 1) === ')') return true;
      i++;
    }
  }
}

export const kpHydra = new KpHydra();
export default kpHydra;

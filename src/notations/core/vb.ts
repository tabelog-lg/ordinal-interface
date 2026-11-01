/**
 * VB 兼容层。
 *
 * 第二批 3 个记号（KP Hydra / LPrSS / PSS Hydra）原程序是 VB.NET 写的，
 * 字符串处理全部走 `Strings.Mid(s, start, length)`，而 VB 的下标是 **1-based**。
 * 直接照搬 JS 的 0-based slice 会整段错位，所以这里显式保留 VB 语义。
 */

/** VB Strings.Mid(s, start, length)：start 从 1 开始，越界返回空串 */
export function vmid(s: string, start: number, length: number): string {
  if (start < 1) start = 1;
  const i = start - 1;
  if (i >= s.length || length <= 0) return '';
  const n = Math.min(length, s.length - i);
  return s.substr(i, n);
}

/** VB Strings.Asc(单字符)：这里只用来判断「是不是数字」（> 45，即 '-' 之后） */
export function vasc(c: string): number {
  return c.length === 0 ? 0 : c.charCodeAt(0);
}

/** Mid 之后再取整数（空串视作 0，对应 VB 里对空串 Val() 的结果） */
export function vmidInt(s: string, start: number, length: number): number {
  const t = vmid(s, start, length);
  return t === '' ? 0 : Number.parseInt(t, 10);
}

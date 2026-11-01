/**
 * LELS —— Linear Eternally Lifting Sequence（Base-ω Array）
 * 矩阵每行表示一组「差值」：d[r][j] = m[r][j] - m[par1(r)][j]，
 * par1() 沿列方向向上找第一个严格更小的行。
 * 展开时复制差值表并按倍数 mul 累加，再把差值还原成元素值。
 */
import { MatrixNotation } from './core/notation';
import { ROWMAX, txma, maout, arow } from './core/matrix';
import { max2 } from './core/seq';

export class Lels extends MatrixNotation {
  override readonly name = 'Linear Eternally Lifting Sequence';
  protected override C = 20;
  protected override ymode = 1;
  private d: number[] = new Array<number>(ROWMAX * 20).fill(0);

  private dAt(r: number, j: number): number {
    return this.d[r * this.C + j] ?? 0;
  }
  private dPut(r: number, j: number, v: number): void {
    this.d[r * this.C + j] = v;
  }

  /** 按 y 列从后往前比较两行：-1 / 0 / 1 */
  private compa(ar: number, br: number): number {
    for (let j = this.y - 1; ; j--) {
      if (j < 0) return 0;
      if (this.at(ar, j) < this.at(br, j)) break;
      if (this.at(br, j) < this.at(ar, j)) return 1;
    }
    return -1;
  }
  /** 差值表版本 */
  private compaD(ar: number, br: number): number {
    for (let j = this.y - 1; ; j--) {
      if (j < 0) return 0;
      if (this.dAt(ar, j) < this.dAt(br, j)) break;
      if (this.dAt(br, j) < this.dAt(ar, j)) return 1;
    }
    return -1;
  }

  /** 向上找第一个严格小于本行的行，返回行号 */
  private par1(r: number): number {
    let sum = 0;
    for (let j = 0; j < this.y; j++) sum += this.at(r, j);
    let p = r;
    if (sum !== 0) while (p >= 0 && this.compa(p, r) >= 0) p -= 1;
    return p;
  }

  override fsLimit(a: number): string {
    this.m = this.mk();
    this.put(1, a - 1, 1);
    if (a === 0) return '(0)';
    return maout(this.m, this.C, 2, a);
  }

  override pred(s: string): string {
    this.m = this.mk();
    const r = txma(s, this.C, this.ymode);
    this.m = r.m;
    this.x = r.rows;
    this.y = r.cols;
    if (this.x === 1) return '0';
    return maout(this.m, this.C, this.x - 1, this.y - 1);
  }

  override fs(n: number, s: string): string {
    this.m = this.mk();
    const r = txma(s, this.C, this.ymode);
    this.m = r.m;
    this.x = r.rows;
    this.y = r.cols;
    if (n === 0) return maout(this.m, this.C, this.x - 1, this.y - 1);
    this.ex(n);
    let out = '';
    for (let r2 = 0; r2 < this.x; r2++) out += arow(this.m, this.C, r2, this.y - 1);
    return out;
  }

  override less(a: string, b: string): boolean {
    if (b.length < 3) return false;
    if (a.length <= 2) return true;
    const A = txma(a, this.C, this.ymode);
    this.d = A.m.slice();
    const rowsA = A.rows;
    const B = txma(b, this.C, this.ymode);
    this.x = B.rows;
    // ★ 原程序在第二次 txma 前只把 x 清 0，y（全局）没清；
    //   txma 仅在读到第 2 行时才改写 y，所以 b 只有 1 行时 y 沿用 a 的列数。
    const colsB = B.rows >= 2 ? B.cols : A.cols;
    // ★ 有意偏离 exe 的修复（已与作者确认 exe 原样行为，但要求修掉）：
    //   原程序这里直接用 colsB，于是**比较宽度只由 b 决定**，
    //   a 比 b 多出来的列被忽略 —— 比较因此不反对称，例如
    //     (0,0,0)(0,0,1) vs (0)(1) 两个方向都判“小于”，
    //   而前者是 fsLimit(3)、后者是 fsLimit(1)，显然不该如此。
    //   改成取两侧列数的较大值，多出来的列按 0 参与比较。
    //   原实现为：this.y = colsB;
    this.y = Math.max(A.cols, colsB);
    const mb = B.m;

    let i = 0;
    while (this.compa2(mb, i) === 0 && i < max2(B.rows, rowsA)) i++;
    const r = this.compa2(mb, i);
    return r !== -1 && (r !== 0 || rowsA < B.rows);
  }
  /** compa(mb[i], d[i]) */
  private compa2(mb: number[], i: number): number {
    for (let j = this.y - 1; ; j--) {
      if (j < 0) return 0;
      if ((mb[i * this.C + j] ?? 0) < this.dAt(i, j)) break;
      if (this.dAt(i, j) < (mb[i * this.C + j] ?? 0)) return 1;
    }
    return -1;
  }

  protected override ex(n: number): void {
    this.d = new Array<number>(ROWMAX * this.C).fill(0);

    // ---- 1) 构造差值表：从最右列往左，到第一个非零差值停；再往左直接抄原值 ----
    for (let r = 0; r < this.x; r++) {
      let c = this.y;
      let skip = false;
      for (;;) {
        const j = c - 1;
        if (j < 0) {
          skip = true;
          break;
        }
        if (this.at(r, j) === 0) this.dPut(r, j, 0);
        else {
          const pr = this.par1(r);
          this.dPut(r, j, this.at(r, j) - this.at(pr, j));
        }
        c = j;
        if (this.dAt(r, j) !== 0) break;
      }
      if (skip) continue;
      for (;;) {
        const j = c - 1;
        if (j < 0) break;
        this.dPut(r, j, this.at(r, j));
        c = j;
      }
    }

    // ---- 2) 定位父行 ----
    // unit = {0, 1}，用于判定「单位行」（越界列按 0 处理，对应原程序读到相邻内存）
    const unitAt = (j: number) => (j === 0 ? 0 : j === 1 ? 1 : 0);
    let uc = 0;
    for (let j = this.y - 1; ; j--) {
      if (j < 0) {
        uc = 0;
        break;
      }
      if (unitAt(j) < this.dAt(this.x - 1, j)) {
        uc = -1;
        break;
      }
      if (this.dAt(this.x - 1, j) < unitAt(j)) {
        uc = 1;
        break;
      }
    }
    const isUnit = this.dAt(this.x - 1, 0) === 1 && (uc === 1 || this.y === 1);

    let p: number;
    if (isUnit) {
      p = this.par1(this.x - 1);
    } else {
      p = this.x - 1;
      while (this.compaD(this.x - 1, p) < 1) {
        const q = this.par1(p);
        if (q === p) break;
        p = q;
      }
    }
    const pr = this.x - 1 - p; // 与父行的行距

    // ---- 3) 两行矩阵且第 2 行各列之和恰为 1 时收一档列数 ----
    let s2 = 0;
    for (let j = this.y - 1; j >= 0; j--) s2 += this.at(1, j);
    if (s2 === 1 && this.x === 2 && 2 < this.y) this.y--;

    // ---- 4) 末行处理 ----
    let c0 = 0;
    let times: number;
    if (this.at(this.x - 1, 0) === 0) {
      while (this.at(this.x - 1, c0) === 0) c0++;
      const pr0 = this.par1(this.x - 1);
      this.put(this.x - 1, c0 - 1, this.at(this.x - 1, c0 - 1) + this.at(pr0, c0 - 1) + n);
      this.put(this.x - 1, c0, this.at(this.x - 1, c0) - 1);
      c0 = 0;
      while (this.dAt(this.x - 1, c0) === 0) c0++;
      this.dPut(this.x - 1, c0, this.dAt(this.x - 1, c0) - 1);
      this.dPut(this.x - 1, c0 - 1, n);
      times = 1;
    } else {
      this.dPut(this.x - 1, 0, this.dAt(this.x - 1, 0) - 1);
      let k = 0;
      while (this.at(this.x - 1, k) === 0) k++;
      this.put(this.x - 1, k, this.at(this.x - 1, k) - 1);
      times = n;
    }

    // ---- 5) 复制并还原 ----
    let firstNZ = -1;
    let mul = 0;
    let r = this.x;
    for (;;) {
      if (times * pr + this.x < r) {
        this.x = times * pr + this.x - 1;
        return;
      }
      let cut = -1;
      let lastNZ = -1; // 扫描段的 k：a[i-l] 里最靠右的非零列
      let nz = -1;
      let low = this.y;
      for (;;) {
        low--;
        // ★ 原程序的扫描是 for(j=y-1;j>=0;j--)，扫到底就自然结束，lf 保留最后一次算出的值。
        //   早期复原在这里把 mul 清零了，于是本该走「抬升」分支的被降级成简单复制，
        //   (0,0)(1,1)(2,0) 这类输入的展开结果就不对了。
        if (low < 0) break;
        if (firstNZ === -1 && this.dAt(this.x - 1, low) !== 0) firstNZ = low;
        if (nz === -1 && this.dAt(r - pr, low) !== 0) nz = low;
        if (nz !== -1 && c0 - 1 <= nz)
          mul = Math.trunc(this.dAt(r - pr, low) / (this.dAt(this.x - 1 - pr, low) + 1));
        if (lastNZ === -1 && this.at(r - pr, low) !== 0) lastNZ = low;
        // ★ 原程序是 if(k<=k3&&k>-1) {lf=0;break;} —— break 前会先把 lf 清零。
        //   早期复原漏了这一步（只在 low<0 时才清零），导致 (0,0)(1,1)(2,1)
        //   这类输入的展开结果与源 exe 不符。
        if (!(firstNZ < lastNZ || lastNZ < 0)) { mul = 0; break; }
      }
      // ★ 原程序里扫描用的 k 与填充用的 au 是**两个**变量（k 在扫描里定，
      //   au 在填充里从 -1 开始更新）。早期复原把两者合成了一个 lastNZ，
      //   于是填充段第一轮的 j<au 判断就沿用了扫描得到的 k，
      //   导致 (0,0)(1,1)(2,1) 这类输入展开结果不对。
      let au = -1;
      for (let j = this.y - 1; j >= 0; j--) {
        if (mul < 1 || pr + this.x - 1 <= r) {
          this.dPut(r, j, this.dAt(r - pr, j));
        } else {
          if (j < cut) this.dPut(r, j, this.dAt(this.x - 1, j) * mul);
          else this.dPut(r, j, this.dAt(r - pr, j) + this.dAt(this.x - 1, j) * mul);
          if (this.dAt(this.x - 1, j) !== 0 && cut === -1) cut = j;
        }
        if (j < au) {
          this.put(r, j, this.dAt(r, j));
        } else {
          const pp = this.par1(r - pr);
          this.put(r, j, this.dAt(r, j) + this.at(pp + pr, j));
        }
        if (this.dAt(r, j) !== 0 && au === -1) au = j;
      }
      r++;
    }
  }
}

export const lels = new Lels();
export default lels;

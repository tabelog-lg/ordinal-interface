// ============================================================================
//  LELS —— Linear Eternally Lifting Sequence（Base-ω Array）
//  矩阵每行表示一组「差值」：d[r][j] = m[r][j] - m[par1(r)][j]，
//  par1() 沿列方向向上找第一个严格更小的行。
//  展开时复制差值表并按倍数 local_54 累加，再把差值还原成元素值。
// ============================================================================
#include "../common.h"

static const int C = 20;
static int m[ROWMAX][C];
static int d[ROWMAX][C];
static int unit[2];                 // {0, 1}，用于判定「单位行」

void name0() { puts("Linear Eternally Lifting Sequence"); }

// 按 y 列从后往前比较两行：-1 / 0 / 1
static int compa(const int *a, const int *b) {
    for (int j = y - 1;; j--) {
        if (j < 0) return 0;
        if (a[j] < b[j]) break;
        if (b[j] < a[j]) return 1;
    }
    return -1;
}

// 向上找第一个严格小于本行的行
static int *par1(int (*mm)[C], int r) {
    int sum = 0;
    for (int j = 0; j < y; j++) sum += mm[r][j];
    int *p = &mm[r][0];
    if (sum != 0)
        while (compa(p, &mm[r][0]) >= 0) p -= C;
    return p;
}

void limit(const char *s) {
    int n = atoi(s);
    memset(m, 0, sizeof(m));
    m[1][n - 1] = 1;
    if (n == 0) cout << "(0)" << endl;
    else        maout<C>(m, 2, n);
}

void type0(const char *s) { matrixType0<C>(s, m, 1); }

void precursor(const char *s) { matrixPrecursor<C>(s, m, 1, -1); }

void compare0(const char *sa, const char *sb) {
    static int mb[ROWMAX][C];
    if (strlen(sb) < 3)  { cout << '1' << endl; return; }
    if (strlen(sa) <= 2) { cout << '2' << endl; return; }
    int rowsA = 0, colsA = 0, rowsB = 0, colsB = 0;
    txma<C>(sa, m, rowsA, colsA, 1);
    x = rowsA; y = colsA;
    for (int r = 0; r < ROWMAX; r++)
        for (int j = 0; j < C; j++) d[r][j] = m[r][j];
    // ★ 原程序在第二次 txma 前只把 x 清 0（y 是全局量，**没有**清）。
    //   txma 仅在读到第 2 行时才改写 y，所以 sb 只有 1 行时 y 沿用 sa 的列数。
    //   这里的 colsB 初值取 colsA，就是为了复现这一点。
    colsB = colsA;
    txma<C>(sb, mb, rowsB, colsB, 1);
    x = rowsB;
    // ★ 有意偏离 exe 的修复（已与作者确认 exe 原样行为，但要求修掉）：
    //   原程序这里直接 `y = colsB`，于是 **比较宽度只由 sb 决定**，
    //   sa 比 sb 多出来的列被忽略 —— 比较因此不反对称，例如
    //     (0,0,0)(0,0,1) vs (0)(1) 两个方向都判“小于”，
    //   而前者是 fsLimit(3)、后者是 fsLimit(1)，显然不该如此。
    //   改成取两侧列数的较大值，多出来的列按 0 参与比较。
    //   原实现为：y = colsB;
    y = max2(colsA, colsB);
    int i = 0;
    while (compa(&mb[i][0], &d[i][0]) == 0 && i < max2(rowsB, rowsA)) i++;
    int r = compa(&mb[i][0], &d[i][0]);
    if (r != -1 && (r != 0 || rowsA < rowsB)) cout << '2' << endl;
    else                                      cout << '1' << endl;
}

static void Ex(int (*mm)[C], int n) {
    memset(d, 0, sizeof(int) * ROWMAX * C);

    // ---- 1) 构造差值表：从最右列往左，到第一个非零差值停；再往左直接抄原值 ----
    for (int r = 0; r < x; r++) {
        int c = y;
        bool skip = false;
        for (;;) {
            int j = c - 1;
            if (j < 0) { skip = true; break; }
            if (mm[r][j] == 0) d[r][j] = 0;
            else {
                int *pp = par1(mm, r);
                d[r][j] = mm[r][j] - pp[j];
            }
            c = j;
            if (d[r][j] != 0) break;
        }
        if (skip) continue;
        for (;;) {
            int j = c - 1;
            if (j < 0) break;
            d[r][j] = mm[r][j];
            c = j;
        }
    }

    // ---- 2) 定位父行 ----
    unit[0] = 0; unit[1] = 1;
    bool isUnit = (d[x - 1][0] == 1) && (compa(unit, &d[x - 1][0]) == 1 || y == 1);

    int *p;
    if (isUnit) {
        p = par1(mm, x - 1);
    } else {
        p = &mm[x - 1][0];
        while (compa(&d[x - 1][0], &d[(int)(p - &mm[0][0]) / C][0]) < 1) {
            int *q = par1(mm, (int)(p - &mm[0][0]) / C);
            if (q == p) break;
            p = q;
        }
    }
    int pr = (int)((&mm[x - 1][0] - p) / C);      // 与父行的行距

    // ---- 3) 两行矩阵且第 2 行各列之和恰为 1 时收一档列数 ----
    int s2 = 0;
    for (int j = y - 1; j >= 0; j--) s2 += mm[1][j];
    if (s2 == 1 && x == 2 && 2 < y) y--;

    // ---- 4) 末行处理 ----
    int c0 = 0, times;
    if (mm[x - 1][0] == 0) {
        while (mm[x - 1][c0] == 0) c0++;
        int *pp = par1(mm, x - 1);
        mm[x - 1][c0 - 1] += pp[c0 - 1] + n;
        mm[x - 1][c0] -= 1;
        c0 = 0;
        while (d[x - 1][c0] == 0) c0++;
        d[x - 1][c0] -= 1;
        d[x - 1][c0 - 1] = n;
        times = 1;
    } else {
        d[x - 1][0] -= 1;
        int k = 0;
        while (mm[x - 1][k] == 0) k++;
        mm[x - 1][k] -= 1;
        times = n;
    }

    // ---- 5) 复制并还原 ----
    int firstNZ = -1, mul = 0, r = x;
    for (;;) {
        if (times * pr + x < r) { x = times * pr + x - 1; return; }

        int cut = -1, lastNZ = -1, nz = -1, low = y;
        for (;;) {
            low--;
            int jj = y;
            // ★ 原程序的扫描是 for(j=y-1;j>=0;j--)，扫到底就自然结束，lf 保留最后一次算出的值。
            //   早期复原在这里把 mul 清零了，于是本该走「抬升」分支的被降级成简单复制，
            //   (0,0)(1,1)(2,0) 这类输入的展开结果就不对了。
            if (low < 0) goto fill;
            if (firstNZ == -1 && d[x - 1][low] != 0) firstNZ = low;
            if (nz == -1 && d[r - pr][low] != 0) nz = low;
            if (nz != -1 && c0 - 1 <= nz)
                mul = d[r - pr][low] / (d[(x - 1) - pr][low] + 1);
            if (lastNZ == -1 && mm[r - pr][low] != 0) lastNZ = low;
            // ★ 原程序是 if(k<=k3&&k>-1) {lf=0;break;} —— break 前会先把 lf 清零。
            //   早期复原漏了这一步（只在 low<0 时才清零），导致 (0,0)(1,1)(2,1)
            //   这类输入的展开结果与源 exe 不符。
            if (!(firstNZ < lastNZ || lastNZ < 0)) { mul = 0; break; }
        }
    fill:
        // ★ 原程序里扫描用的 k 与填充用的 au 是**两个**变量（k 在扫描里定，
        //   au 在填充里从 -1 开始更新）。早期复原把两者合成了一个 lastNZ，
        //   于是填充段第一轮的 j<au 判断就沿用了扫描得到的 k，
        //   导致 (0,0)(1,1)(2,1) 这类输入展开结果不对。
        int au = -1;
        for (int j = y - 1; j >= 0; j--) {
            if (mul < 1 || pr + x - 1 <= r) {
                d[r][j] = d[r - pr][j];
            } else {
                if (j < cut) d[r][j] = d[x - 1][j] * mul;
                else         d[r][j] = d[r - pr][j] + d[x - 1][j] * mul;
                if (d[x - 1][j] != 0 && cut == -1) cut = j;
            }
            if (j < au) {
                mm[r][j] = d[r][j];
            } else {
                int *pp = par1(mm, r - pr);
                mm[r][j] = d[r][j] + pp[j + pr * C];
            }
            if (d[r][j] != 0 && au == -1) au = j;
        }
        r++;
    }
}

void expand(const char *ns, const char *seq) {
    int n = atoi(ns);
    int rows = 0, cols = 0;
    txma<C>(seq, m, rows, cols, 1);
    x = rows; y = cols;
    if (n == 0) { maout<C>(m, x - 1, y - 1); return; }
    Ex(m, n);
    for (int r = 0; r < x; r++) arow<C>(m, r, y - 1);
    cout << endl;
}

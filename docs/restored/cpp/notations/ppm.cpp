// ============================================================================
//  Parented Predecessor Matrix
//  末行末列的值给出父行 pr；先判定末行该列是「降级」还是「回落到父值」，
//  再把右侧按父行补齐，最后整块复制 n 次。
// ============================================================================
#include "../matrix_bms.h"

static const int C = 20;
static int m[ROWMAX][C];
static int w[ROWMAX][C];
static int *base = &m[0][0];

void name0() { puts("Parented Predecessor Matrix 2"); }

void limit(const char *s) {
    int n = atoi(s);
    memset(m, 0, sizeof(m));
    for (int i = 0; i < n; i++) m[1][i] = 1;
    if (n == 0) cout << "(0)(0)" << endl;
    else        maout<C>(m, 2, n);
}
void type0(const char *s)      { matrixType0<C>(s, m, 0); }
void precursor(const char *s)  { matrixPrecursor<C>(s, m, 0); }
void compare0(const char *a, const char *b) { matrixCompare<C>(a, b, m, 0); }

static void Ex(int (*mm)[C], int n) {
    for (int r = 0; r < x; r++)
        for (int j = 0; j < y; j++) w[r][j] = mm[r][j];

    int nc = 0;                              // 末行非零列数
    while (mm[x - 1][nc] != 0) nc++;
    int c0 = nc - 1;                         // 末列
    int pr = mm[x - 1][c0] - 1;              // 父行
    int L  = (x - 1) - pr;

    if (x == 2 && y != 1) y--;

    // 末元素：若链上有同值则回落到父值，否则 -1
    bool descend = true;
    if (c0 < 1) {
        for (int r = x - 2; pr < r; r--)
            if (mm[r][c0] == mm[pr][c0]) descend = false;
    } else {
        int r = mm[x - 1][nc - 2];           // 沿倒数第二列的父链向上
        for (;;) {
            r = r - 1;
            if (!(pr < r)) break;
            if (mm[r][c0] == mm[pr][c0]) descend = false;
            r = mm[r][nc - 2];
        }
    }
    if (descend) mm[x - 1][c0] -= 1;
    else         mm[x - 1][c0]  = mm[pr][c0];

    // 右侧按父行补齐（差值平移）
    for (int j = nc; mm[pr][j] != 0; j++)
        mm[x - 1][j] = (mm[pr][j] + mm[x - 1][c0]) - mm[pr][c0];

    // 复制
    for (int r = x; r <= n * L + x; r++) {
        if ((r - pr) % L == 0) {
            for (int j = 0; j < y; j++)
                mm[r][j] = (j < c0) ? mm[r - L][j] + L : mm[r - L][j];
        } else {
            for (int j = 0; j < y; j++)
                mm[r][j] = (pr < mm[r - L][j]) ? mm[r - L][j] + L : mm[r - L][j];
        }
    }
    x = n * L + x - 1;
}

void expand(const char *ns, const char *seq) {
    int n = atoi(ns);
    int rows = 0, cols = 0;
    txma<C>(seq, m, rows, cols, 0);
    x = rows; y = cols;
    if (n == 0) { maout<C>(m, x - 1, y); return; }
    Ex(m, n);
    dumpMat<C>(m, x, y);
}

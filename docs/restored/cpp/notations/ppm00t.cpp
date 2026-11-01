// ============================================================================
//  Parented Predecessor Matrix 00T
//  同 PPM，但：不因 x==2 收缩列数；而是在末尾检查第 y+1 行，
//  若其第 y-1 列为 0 则把列数收一档（00T 的 T = 尾部裁剪）
// ============================================================================
#include "../matrix_bms.h"

static const int C = 20;
static int m[ROWMAX][C];
static int w[ROWMAX][C];
static int *base = &m[0][0];

void name0() { puts("Parented Predecessor Matrix 00T"); }

// limit：下三角矩阵，第 r 行前 r 列填 r
void limit(const char *s) {
    int n = atoi(s);
    memset(m, 0, sizeof(m));
    for (int r = 2;; r++) {
        if (n < r) break;
        for (int j = 0; j < r - 1; j++) m[r][j] = r;
    }
    if (n == 0) cout << "(0)" << endl;
    else {
        int rows = atoi(s) + 1;
        int cols = max2(atoi(s) - 1, 1);
        maout<C>(m, rows, cols);
    }
}
void type0(const char *s)      { matrixType0<C>(s, m, 0); }
void precursor(const char *s)  { matrixPrecursor<C>(s, m, 0); }
void compare0(const char *a, const char *b) { matrixCompare<C>(a, b, m, 0); }

static void Ex(int (*mm)[C], int n) {
    for (int r = 0; r < x; r++)
        for (int j = 0; j < y; j++) w[r][j] = mm[r][j];

    int nc = 0;
    while (mm[x - 1][nc] != 0) nc++;
    int c0 = nc - 1;
    int pr = mm[x - 1][c0] - 1;
    int L  = (x - 1) - pr;

    bool descend = true;
    if (c0 < 1) {
        for (int r = x - 2; pr < r; r--)
            if (mm[r][c0] == mm[pr][c0]) descend = false;
    } else {
        int r = mm[x - 1][nc - 2];
        for (;;) {
            r = r - 1;
            if (!(pr < r)) break;
            if (mm[r][c0] == mm[pr][c0]) descend = false;
            r = mm[r][nc - 2];
        }
    }
    if (descend) mm[x - 1][c0] -= 1;
    else         mm[x - 1][c0]  = mm[pr][c0];

    for (int j = nc; mm[pr][j] != 0; j++)
        mm[x - 1][j] = (mm[pr][j] + mm[x - 1][c0]) - mm[pr][c0];

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
    if (mm[y + 1][y - 1] == 0 && y != 1) y--;     // 尾部裁剪
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

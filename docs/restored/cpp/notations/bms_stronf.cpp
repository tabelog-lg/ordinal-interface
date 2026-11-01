// ============================================================================
//  Stronf Bashicu Matrix
//  先构造「差值矩阵」ac[r][j] = max(m[r][j] - m[父行][j], 0)，
//  复制时若末行末列位置未变则用 asmt 抬升，否则直接用差值矩阵累加。
// ============================================================================
#include "../matrix_bms.h"

static const int C = 20;
static int m[ROWMAX][C];
static int w[ROWMAX][C];
static int *base = &m[0][0];

void name0() { puts("Stronf Bashicu Matrix"); }

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

static int sgn(int v) { return v < 0 ? -1 : (v > 0 ? 1 : 0); }

static void Ex(int (*mm)[C], int n) {
    int delta[24];
    memset(delta, 0, sizeof(delta));
    int *basep = &mm[0][0];

    // 差值矩阵：每位减去其所在行的父行的同列值（下界 0）
    for (int r = 1; r < x; r++) {
        if (mm[r][0] == 0) continue;
        int *pp = bmsPar<C>(&mm[r][0], r * C, basep);
        int pr = (int)(pp - basep) / C;
        for (int j = 0; j < y; j++) {
            int d = mm[r][j] - mm[pr][j];
            w[r][j] = max2(d, 0);
        }
    }

    int c0 = 0;
    while (mm[x - 1][c0] != 0) c0++;
    c0--;
    w[x - 1][c0] -= 1;                              // 末行末列先 -1

    int *pp = bmsPar<C>(&mm[x - 1][c0], ((x - 1) * C + c0), basep);
    int pr = (int)(pp - basep) / C;

    int j2 = c0;                                    // 父行中 >= 末行该值的最右列 +1
    while (j2 >= 0 && mm[pr][j2] < mm[x - 1][c0]) j2--;
    j2++;

    for (int j = 0; j < c0; j++) delta[j] = mm[x - 1][j] - mm[pr][j];

    int L = (x - 1) - pr;
    if (x == 2 && y != 1) y--;

    mm[x - 1][c0] -= 1;
    for (int j = c0 + 1; j < y; j++) mm[x - 1][j] = mm[pr][j];

    for (int r = x; r <= n * L + x; r++)
        for (int j = 0; j < y; j++) {
            if (c0 == j2) {
                int v   = mm[r - L][j];
                int d   = delta[j];
                int asc = bmsAsmt<C>(&mm[r - L][j], pr, ((r - L) * C + j), basep);
                mm[r][j] = d * asc + v;
            } else {
                mm[r][j] = w[r - L][j] + mm[r - 1][j];
                w[r][j]  = w[r - L][j];
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

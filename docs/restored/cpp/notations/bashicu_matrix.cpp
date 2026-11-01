// ============================================================================
//  Bashicu Matrix （2 行 / 20 列，BMS 的基准实现）
//  展开：找末行最右非零列的父行 pr，
//        末行该列 -1、右侧补齐为父行对应值，
//        之后复制 (x-1-pr) 行 n 次，每列按 asmt() 决定是否在落差上加 Δ
// ============================================================================
#include "../matrix_bms.h"

static const int C = 20;
static int m[ROWMAX][C];
static int w[ROWMAX][C];
static int *base = &m[0][0];

void name0() { puts("Bashicu Matrix"); }

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
    int delta[24];
    memset(delta, 0, sizeof(delta));
    int *basep = &mm[0][0];

    for (int r = 0; r < x; r++)
        for (int j = 0; j < y; j++) w[r][j] = mm[r][j];

    int c0 = 0;
    while (mm[x - 1][c0] != 0) c0++;      // 末行最右非零列 +1
    c0--;

    int *pp = bmsPar<C>(&mm[x - 1][c0], ((x - 1) * C + c0), basep);
    int pr = (int)(pp - basep) / C;

    for (int j = 0; j < c0; j++) delta[j] = w[x - 1][j] - w[pr][j];

    int L = (x - 1) - pr;
    if (x == 2 && y != 1) y--;            // 两行矩阵的列数收缩

    mm[x - 1][c0] -= 1;
    for (int j = c0 + 1; j < y; j++) mm[x - 1][j] = mm[pr][j];

    for (int r = x; r <= n * L + x; r++)
        for (int j = 0; j < y; j++) {
            int v   = mm[r - L][j];
            int d   = delta[j];
            int asc = bmsAsmt<C>(&mm[r - L][j], pr, ((r - L) * C + j), basep);
            mm[r][j] = d * asc + v;
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

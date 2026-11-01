// ============================================================================
//  Bashicu Matrix 4.1
//  与标准 BMS 的差别：抬升判定 asmt() 多带两个参数——
//  先取父行自身的父行作为目标，且只在该列的「上界」之上才抬升。
// ============================================================================
#include "../matrix_bms.h"

static const int C = 20;
static int m[ROWMAX][C];
static int w[ROWMAX][C];
static int *base = &m[0][0];

void name0() { puts("Bashicu Matrix 4.1"); }

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

// BM4.1 专用 asmt：col 之上才考虑抬升
static int asmt4(int *cell, int target, int k, int col, int *basep) {
    int buf[301];
    memset(buf, 0, sizeof(buf));
    if (col < k % C) return 1;
    if (*cell == 0)  return 0;
    int *q = cell;
    int c = 0;
    while (basep < q && *q != 0) {
        q = bmsPar<C>(q, k + (int)(q - cell), basep);
        buf[c] = (int)(((int)(q - cell) + k) / C);
        if (*q == 0) {
            int v = (int)(((int)(q - cell) + k) / C);
            if (v != target && -1 < v - target) return 0;
        }
        c++;
    }
    for (int i = c + 1; i >= 0; i--)
        if (target == buf[i]) return 1;
    return 0;
}

static void Ex(int (*mm)[C], int n) {
    int delta[24];
    memset(delta, 0, sizeof(delta));
    int *basep = &mm[0][0];

    for (int r = 0; r < x; r++)
        for (int j = 0; j < y; j++) w[r][j] = mm[r][j];

    int c0 = 0;
    while (mm[x - 1][c0] != 0) c0++;
    c0--;

    int *pp = bmsPar<C>(&mm[x - 1][c0], ((x - 1) * C + c0), basep);
    int pr = (int)(pp - basep) / C;

    int c1 = -1;                                   // 父行的末列
    while (mm[pr][c1 + 1] != 0) c1++;
    int *pp2 = bmsPar<C>(&mm[pr][c1], (pr * C + c1), basep);
    int pr2 = (int)(pp2 - basep) / C;

    for (int j = 0; j < c0; j++) delta[j] = w[x - 1][j] - w[pr][j];

    int L = (x - 1) - pr;
    if (x == 2 && y != 1) y--;

    mm[x - 1][c0] -= 1;
    for (int j = c0 + 1; j < y; j++) mm[x - 1][j] = mm[pr][j];

    for (int r = x; r <= n * L + x; r++)
        for (int j = 0; j < y; j++) {
            int v   = mm[r - L][j];
            int d   = delta[j];
            int asc = asmt4(&mm[r - L][j], pr2, ((r - L) * C + j), c1, basep);
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

// ============================================================================
//  Upgradissimo Bashicu Matrix
//  差值矩阵就是原矩阵副本；抬升判定 asmt 换成递归版：
//  先看右侧一列是否抬升，再看本列是否落在允许区间内。
// ============================================================================
#include "../matrix_bms.h"

static const int C = 20;
static int m[ROWMAX][C];
static int w[ROWMAX][C];
static int *base = &m[0][0];

void name0() { puts("Upgradissimo Bashicu Matrix"); }

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

// 递归抬升判定
static int asmt5(int *cell, int target, int k, int c0, int j2, int *basep) {
    int buf[301];
    memset(buf, 0, sizeof(buf));
    if (k % C < c0) {
        int r = asmt5(cell + 1, target, k + 1, c0, j2, basep);
        if (r == 1) return 1;
        if (k % C < j2) {
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
        return 1;
    }
    return 0;
}

static void Ex(int (*mm)[C], int n) {
    int delta[24];
    memset(delta, 0, sizeof(delta));
    int *basep = &mm[0][0];

    for (int r = 1; r < x; r++)
        if (mm[r][0] != 0)
            for (int j = 0; j < y; j++) w[r][j] = mm[r][j];

    int c0 = 0;
    while (mm[x - 1][c0] != 0) c0++;
    c0--;

    int *pp = bmsPar<C>(&mm[x - 1][c0], ((x - 1) * C + c0), basep);
    int pr = (int)(pp - basep) / C;

    int j2 = c0;
    while (j2 >= 0 && mm[pr][j2] < mm[x - 1][c0]) j2--;
    j2++;

    for (int j = 0; j < c0; j++) delta[j] = mm[x - 1][j] - mm[pr][j];

    int L = (x - 1) - pr;
    if (x == 2 && y != 1) y--;

    mm[x - 1][c0] -= 1;
    for (int j = c0 + 1; j < y; j++) mm[x - 1][j] = mm[pr][j];

    for (int r = x; r <= n * L + x; r++)
        for (int j = 0; j < y; j++) {
            int v   = mm[r - L][j];
            int d   = delta[j];
            int asc = asmt5(&mm[r - L][j], pr, ((r - L) * C + j), c0, j2, basep);
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

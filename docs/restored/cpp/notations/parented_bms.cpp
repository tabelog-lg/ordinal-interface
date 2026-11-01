// ============================================================================
//  Parented Bashicu Matrix
//  与 BMS 的差别：不用 par() 求父——末行末列的值本身就是父的行号。
// ============================================================================
#include "../matrix_bms.h"

static const int C = 20;
static int m[ROWMAX][C];
static int w[ROWMAX][C];
static int *base = &m[0][0];

void name0() { puts("Parented Bashicu Matrix"); }

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

    int c0 = 0;
    while (mm[x - 1][c0] != 0) c0++;
    c0--;

    int pr = mm[x - 1][c0] - 1;          // 父行号直接取自元素值
    int L  = (x - 1) - pr;

    if (x == 2 && y != 1) y--;
    for (int j = c0; j < y; j++) mm[x - 1][j] = mm[pr][j];   // 右侧补齐

    for (int r = x; r <= n * L + x; r++) {
        if ((r - pr) % L == 0) {                             // 提升行
            for (int j = 0; j < y; j++)
                mm[r][j] = (j < c0) ? mm[r - L][j] + L : mm[r - L][j];
        } else {
            for (int j = 0; j < y; j++)
                mm[r][j] = (mm[r - L][j] < mm[x - 1][c0]) ? mm[r - L][j]
                                                          : mm[r - L][j] + L;
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

// ============================================================================
//  Limited Row-Extending BMS (non-Ceiling-upgrade)
//  与 Bashicu 的差别：
//    * 矩阵 40 列（COLS=40），行内变长（输出遇到 0 即收尾）
//    * 复制之后还要重建「父表」，按父表把每个元素重算成 父+1
//      —— 这就是 row-extending：行会向右延伸
// ============================================================================
#include "../matrix_bms.h"

static const int C = 40;
static int m[ROWMAX][C];
static int w[ROWMAX][C];
static int *base = &m[0][0];

void name0() { puts("Limited Row-Extending BMS (non-Ceiling-upgrade)"); }

// 行内变长输出：遇到 0 收尾
static void arowVar(int (*mm)[C], int r) {
    cout << '(';
    for (int j = 0;; j++) {
        cout << mm[r][j];
        if (mm[r][j + 1] == 0) { cout << ')'; break; }
        cout << ',';
    }
}
static void maoutVar(int (*mm)[C], int rows) {
    for (int r = 0; r < rows; r++) arowVar(mm, r);
    cout << endl;
}

void limit(const char *s) {
    int n = atoi(s);
    memset(m, 0, sizeof(m));
    for (int i = 0; i < n; i++) m[1][i] = 1;
    if (n == 0) cout << "(0)(0)" << endl;
    else        maoutVar(m, 2);
}

void type0(const char *s) {                     // 该变体按固定 40 列检查末行
    if (strlen(s) < 3) { cout << '1' << endl; return; }
    int rows = 0, cols = 0;
    txma<C>(s, m, rows, cols, 2);
    x = rows;
    bool allzero = true;
    for (int j = 0; j < C; j++) if (m[x - 1][j] != 0) allzero = false;
    cout << (allzero ? '2' : '3') << endl;
}
void precursor(const char *s) {
    int rows = 0, cols = 0;
    txma<C>(s, m, rows, cols, 2);
    x = rows;
    if (x == 1) cout << '0' << endl;
    else        maoutVar(m, x - 1);
}
void compare0(const char *a, const char *b) { matrixCompare<C>(a, b, m, 2); }

static void Ex(int (*mm)[C], int n) {
    int delta[44];
    memset(delta, 0, sizeof(delta));
    int par[ROWMAX];                 // 每行的父行
    int last[ROWMAX];                // 每行末列
    int pt[ROWMAX][C];               // 父表
    memset(pt, 0, sizeof(pt));
    memset(par, 0, sizeof(par));
    int *basep = &mm[0][0];

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
    mm[x - 1][c0] -= 1;
    for (int j = c0 + 1; j < C; j++) mm[x - 1][j] = mm[pr][j];

    for (int r = x; r <= n * L + x; r++)
        for (int j = 0; j < C; j++) {
            int v   = mm[r - L][j];
            int d   = delta[j];
            int asc = bmsAsmt<C>(&mm[r - L][j], pr, ((r - L) * C + j), basep);
            mm[r][j] = d * asc + v;
        }

    // ---- 重建父表 ----
    for (int r = 1; r < n * L + x - 1; r++)
        for (int j = 0; j < C; j++) {
            if (mm[r][j] != 0 && mm[r][j + 1] == 0) last[r] = j;
            if (mm[r][j] == 0) pt[r][j] = -1;
            else {
                int *q = bmsPar<C>(&mm[r][j], r * C + j, basep);
                pt[r][j] = (int)(q - basep) / C;
            }
        }
    // ---- 行延伸：末列超过阈值时，右侧各列改挂到第 j2 列 ----
    for (int r = x; r < n * L + x - 1; r++) {
        if (j2 <= last[r]) {
            for (int j = C - 1; j >= 0; j--) {
                if ((j - c0) + j2 < 0) pt[r][j] = pt[r][0];
                else                   pt[r][j] = pt[r][(j - c0) + j2];
            }
        }
    }
    // ---- 按父表重算元素值 ----
    for (int r = x; r <= n * L + x; r++)
        for (int j = 0; j < C; j++) {
            if (pt[r][j] < 0) mm[r][j] = 0;
            else              mm[r][j] = mm[pt[r][j]][j] + 1;
        }
    x = n * L + x - 1;
}

void expand(const char *ns, const char *seq) {
    int n = atoi(ns);
    int rows = 0, cols = 0;
    txma<C>(seq, m, rows, cols, 2);
    x = rows; y = cols;
    if (n == 0) { maoutVar(m, x - 1); return; }
    Ex(m, n);
    for (int r = 0; r < x; r++) arowVar(m, r);
    cout << endl;
}

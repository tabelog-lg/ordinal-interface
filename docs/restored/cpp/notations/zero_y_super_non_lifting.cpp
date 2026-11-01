// ============================================================================
//  Ultimately Idealized 0-Y Sequence  （0-Y 的 non-lifting 变体）
//  与 0-Y 的三点差别：
//   1) 先单独给「末元素」定父：从 x-2 往前找第一个 a[j] < a[x-1] 且为祖先者
//   2) 主循环里除 pare() 外还多一条「落差过小 / 位置过前」的排除条件，
//      且 j==0 时无条件接受（即使 a[0] >= a[i]）
//   3) 递归后祖先下标一律 +l，不再取 min —— 即不再做 lifting
// ============================================================================
#include "../common.h"

static const int BIAS = 0;

void name0() { puts("Ultimately Idealized 0-Y Sequence"); }

void limit(const char *s) {
    int n = atoi(s);
    arout(seqLimitTwo(n), 0);
}
void type0(const char *s)      { seqType0(s, BIAS); }
void precursor(const char *s)  { seqPrecursor(s, BIAS); }
void compare0(const char *a, const char *b) { seqCompare(a, b, BIAS); }

static void Ex(int *a, int n) {
    int fb[SEQMAX];
    int an[1002];
    memset(fb, 0, sizeof(fb));
    memset(an, 0, sizeof(an));
    fb[0] = 1;
    an[0] = 0;

    // 1) 末元素的父
    for (int j = x - 2;; j--) {
        if (j < 0) break;
        if (a[j] < a[x - 1] && pare(x - 1, j, pm) == 1) {
            fb[x - 1] = a[x - 1] - a[j];
            an[x - 1] = j;
            pm[x - 1] = j + 1;
            break;
        }
    }

    // 2) 其余位置的父
    for (int i = 1;; i++) {
        if (x <= i) {
            l = (x - 1) - an[x - 1];
            if (fb[x - 1] == 1) {
                for (int k = x - 1; k < l * n + x - 1; k++) a[k] = a[k - l];
            } else {
                Ex(fb, n);
                for (int k = x; k < l * n + x - 1; k++) an[k] = an[k - l] + l;
                for (int k = x - 1; k < l * n + x - 1; k++) a[k] = fb[k] + a[an[k]];
            }
            return;
        }
        if (a[i] == 1) {
            fb[i] = 1;
            an[i] = -1;
            pm[i] = -1;
        } else {
            for (int j = i; j >= 0; j--) {
                bool ok;
                if (a[j] < a[i]) {
                    if (pare(i, j, pm) != 1) goto reject;
                    if ((a[i] - a[j] < fb[x - 1]) && (an[x - 1] < i)) goto reject;
                    ok = true;
                } else {
                reject:
                    ok = (j == 0);          // 到头了就无条件接受
                }
                if (ok) {
                    fb[i] = a[i] - a[j];
                    an[i] = j;
                    pm[i] = j + 1;
                    break;
                }
            }
        }
    }
}

void expand(const char *ns, const char *seq) {
    int n = atoi(ns);
    int *a = txar(seq, BIAS);
    int i = 1;
    while (a[i] != 0) i++;
    x = i;
    for (int k = 0; k < SEQMAX; k++) pm[k] = k;
    if (n == 0) a[x - 1] = 0;
    else        Ex(a, n);
    arout(a, -BIAS);
}

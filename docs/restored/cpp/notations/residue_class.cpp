// ============================================================================
//  Residue Class Sequence
//  与 Coprime 类似地求父链；但复制起点要额外满足：
//  该祖先起 len 个位置覆盖了所有模 delta 的余数类（intd 全 1）。
//  末元素的最终取值由未出现的余数类个数决定。
// ============================================================================
#include "../common.h"

static const int BIAS = 0;

void name0() { puts("Residue Class Sequence"); }

void limit(const char *s) {
    int n = atoi(s);
    arout(seqLimitTwo(n), 0);
}
void type0(const char *s)      { seqType0(s, BIAS); }
void precursor(const char *s)  { seqPrecursor(s, BIAS); }
void compare0(const char *a, const char *b) { seqCompare(a, b, BIAS); }

// a 从 p 起是否出现了余数 k (mod delta)
static int intd(const int *p, int k, int delta) {
    for (int c = 0;; c++) {
        if (p[c] == 0) return 0;
        if (k == p[c] % delta) break;
    }
    return 1;
}

static void Ex(int *a, int n) {
    int fb[1003];
    memset(fb, 0, sizeof(fb));
    fb[0] = -1;
    for (int i = 1; i < x; i++) {
        if (a[i] == 1) fb[i] = -1;
        else {
            for (int j = i; j >= 0; j--)
                if (a[j] < a[i]) { fb[i] = j; break; }
        }
    }

    int delta = a[x - 1] - a[fb[x - 1]];
    int ok = 0;
    int k  = fb[x - 1];
    while (k != -1) {                       // 沿父链找一个余数类齐全的祖先
        ok = 1;
        for (int c = 0; c < delta; c++) ok *= intd(a + k, c, delta);
        if (ok == 1) break;
        k = fb[k];
    }

    int r = 1 - delta;
    for (;;) {                              // 统计沿链缺失的余数类
        int j = x - 1;
        while (j >= 0 && (a[j] % delta != r + delta)) j = fb[j];
        if (j == -1) break;
        r++;
    }
    if (k == -1) r = a[x - 1] - r;
    else         r = a[x - 1] - a[k];

    l = (x - 1) - k;
    a[x - 1] -= 1;
    for (int i = x; i < l * n + x - 1; i++) a[i] = r - 1 + a[i - l];
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

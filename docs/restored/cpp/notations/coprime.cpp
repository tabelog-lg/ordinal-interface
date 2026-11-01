// ============================================================================
//  Coprime Series sequence
//  先给每位求父（向前第一个更小值），再沿父链上溯到第一个与末元素
//  「不互质」的位置，以它作为复制块的起点。
//  注意 coprime() 的返回值语义与名字相反：返回 1 表示「有 >1 的公因子」。
// ============================================================================
#include "../common.h"

static const int BIAS = 0;

void name0() { puts("Coprime Series sequence"); }

void limit(const char *s) {
    int n = atoi(s);
    arout(seqLimitTwo(n), 0);
}
void type0(const char *s)      { seqType0(s, BIAS); }
void precursor(const char *s)  { seqPrecursor(s, BIAS); }
void compare0(const char *a, const char *b) { seqCompare(a, b, BIAS); }

static int coprime(int a, int b) {
    for (int c = 2;; c++) {
        if (a + 1 < c) return 0;                    // 没有公共因子
        if (a % c == 0 && b % c == 0) break;
    }
    return 1;                                       // 存在 >1 的公因子
}

static void Ex(int *a, int n) {
    int fb[1001];
    memset(fb, 0, sizeof(fb));
    fb[0] = 0;

    for (int i = 1;; i++) {
        if (x <= i) {
            int k = fb[x - 1];
            while (coprime(a[x - 1], a[k]) == 1) k = fb[k];
            l = (x - 1) - k;
            int hi = a[x - 1], lo = a[k];
            for (int j = x - 1; j < l * n + x - 1; j++)
                a[j] = (hi - lo) - 1 + a[j - l];
            return;
        }
        if (a[i] == 1) fb[i] = -1;
        else {
            for (int j = i; j >= 0; j--)
                if (a[j] < a[i]) { fb[i] = j; break; }
        }
    }
}

void expand(const char *ns, const char *seq) { seqExpand(ns, seq, BIAS, Ex); }

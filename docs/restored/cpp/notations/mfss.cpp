// ============================================================================
//  MFSS —— Multiple Father Sequence System
//  序列里每个值可以出现多次；展开时要求连续凑够 md 个「次大值」才定位父。
//  md 是编译期常量（反编译未给出初值，此处取 2；exe 启动时 name0 会打印它）
// ============================================================================
#include "../common.h"

static const int BIAS = 1;
static const int md = 2;

void name0() { printf("Multiple Father Sequence System (%d fathers)\n", md); }

void limit(const char *s)      { seqLimitExact(atoi(s), BIAS); }
void type0(const char *s)      { seqType0(s, BIAS); }
void precursor(const char *s)  { seqPrecursor(s, BIAS); }
void compare0(const char *a, const char *b) { seqCompare(a, b, BIAS); }

static void Ex(int *a, int n) {
    int c = -1, cnt = 0;

    // 从右往左找第 md 个等于 a[x-1]-1 的位置
    for (int i = x - 1; i >= 0 && c == -1; i--) {
        if (a[i] == a[x - 1] - 1) {
            if (cnt == md - 1) c = i;
            else               cnt++;
        }
    }
    if (c == -1) {                       // 不够 md 个：退化为取最后一个
        for (int i = 0; i < x; i++)
            if (a[i] == a[x - 1] - 1) c = i;
    }

    int L = (x - 1) - c;
    for (int i = x - 1; i < n * L + x - 1; i++) a[i] = a[i - L];
    x = n * L + x - 1;
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

// ============================================================================
//  Simplified -2-Y Sequence
//  极简版：直接把末元素减 1，并向右填充 n 个位置
// ============================================================================
#include "../common.h"

static const int BIAS = 0;

void name0() { puts("Simplified -2-Y Sequence"); }

void limit(const char *s) {
    int n = atoi(s);
    arout(seqLimitTwo(n), 0);
}
void type0(const char *s)      { seqType0(s, BIAS); }
void precursor(const char *s)  { seqPrecursor(s, BIAS); }
void compare0(const char *a, const char *b) { seqCompare(a, b, BIAS); }

static void Ex(int *a, int n) {
    int v = a[x - 1];
    for (int i = x - 1; i < x + n - 1; i++) a[i] = v - 1;
}

void expand(const char *ns, const char *seq) { seqExpand(ns, seq, BIAS, Ex); }

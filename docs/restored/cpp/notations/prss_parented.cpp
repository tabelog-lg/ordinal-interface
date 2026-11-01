// ============================================================================
//  Parented Primitive Sequence System
//  一维序列，内部 +1 存储（0 留给结束哨兵），输出时 -1
//  展开即最朴素的 PrSS：以末元素的值定父，整段复制 n 次，提升点抬 L
// ============================================================================
#include "../common.h"

static const int BIAS = 1;

void name0() { puts("Parented Primitive Sequence System"); }

void limit(const char *s)      { seqLimit(atoi(s), BIAS); }
void type0(const char *s)      { seqType0(s, BIAS); }
void precursor(const char *s)  { seqPrecursor(s, BIAS); }
void compare0(const char *a, const char *b) { seqCompare(a, b, BIAS); }

static void Ex(int *a, int n) {
    int p = a[x - 1] - 2;        // 父下标
    int L = (x - 1) - p;         // 段长

    for (int c = 0; c < n; c++)
        for (int j = 0; j < L; j++) {
            int i = x - 1 + c * L + j;
            if ((i - p) % L == 0) a[i] = a[i - L];      // 提升点：照抄上一段
            else                  a[i] = a[i - L] + L;  // 其余抬 L
        }
}

void expand(const char *ns, const char *seq) { seqExpand(ns, seq, BIAS, Ex); }

// ============================================================================
//  Parented Predecessor Sequence 4
//  降级方式换成向下扫描：找到第一个 a[c] <= a[p] 的位置，末元素取 c+2
// ============================================================================
#include "../common.h"

static const int BIAS = 1;

void name0() { puts("Parented Predecessor Sequence 4"); }

void limit(const char *s)      { seqLimit(atoi(s), BIAS); }
void type0(const char *s)      { seqType0(s, BIAS); }
void precursor(const char *s)  { seqPrecursor(s, BIAS); }
void compare0(const char *a, const char *b) { seqCompare(a, b, BIAS); }

static void Ex(int *a, int n) { ppsEx(a, n, DEC_SCAN_LE, false); }

void expand(const char *ns, const char *seq) { seqExpand(ns, seq, BIAS, Ex); }

// ============================================================================
//  second extremely weak Parented Predecessor Sequence 4
//  降级扫描 == 且遇更小值直接跳到边界（扫描更容易中止，故更弱）
// ============================================================================
#include "../common.h"

static const int BIAS = 1;

void name0() { puts("second extremely weak Parented Predecessor Sequence 4"); }

void limit(const char *s)      { seqLimit(atoi(s), BIAS); }
void type0(const char *s)      { seqType0(s, BIAS); }
void precursor(const char *s)  { seqPrecursor(s, BIAS); }
void compare0(const char *a, const char *b) { seqCompare(a, b, BIAS); }

static void Ex(int *a, int n) { ppsEx(a, n, DEC_SCAN_EQ_SKIP, true); }

void expand(const char *ns, const char *seq) { seqExpand(ns, seq, BIAS, Ex); }

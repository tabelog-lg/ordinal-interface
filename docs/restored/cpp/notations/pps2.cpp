// ============================================================================
//  Parented Predecessor Sequence 2
//  PPS 家族基线：末元素先按「是否与父同值」处理，再 -1 降级，然后分段复制
// ============================================================================
#include "../common.h"

static const int BIAS = 1;

void name0() { puts("Parented Predecessor Sequence 2"); }

void limit(const char *s)      { seqLimit(atoi(s), BIAS); }
void type0(const char *s)      { seqType0(s, BIAS); }
void precursor(const char *s)  { seqPrecursor(s, BIAS); }
void compare0(const char *a, const char *b) { seqCompare(a, b, BIAS); }

static void Ex(int *a, int n) { ppsEx(a, n, DEC_MINUS1, false); }

void expand(const char *ns, const char *seq) { seqExpand(ns, seq, BIAS, Ex); }

// ============================================================================
//  Parented Predecessor Sequence 3
//  与 PPS2 的差别只在复制阶段：提升点若末元素已降到父值则照抄，否则再抬 L
// ============================================================================
#include "../common.h"

static const int BIAS = 1;

void name0() { puts("Parented Predecessor Sequence 3"); }

void limit(const char *s)      { seqLimit(atoi(s), BIAS); }
void type0(const char *s)      { seqType0(s, BIAS); }
void precursor(const char *s)  { seqPrecursor(s, BIAS); }
void compare0(const char *a, const char *b) { seqCompare(a, b, BIAS); }

static void Ex(int *a, int n) { ppsEx(a, n, DEC_MINUS1, true); }

void expand(const char *ns, const char *seq) { seqExpand(ns, seq, BIAS, Ex); }

// ============================================================================
//  Parented Predecessor Sequence 4 —— 另一版本（2026-11-07 提供的 exe.c）
//
//  与 pps4.cpp 唯一差别在 Ex() 的「末元素降级」扫描：
//    旧版：for (c = a[x-1]-3; a[p]-1 <= c; c--)  下界是 a[p]-1，
//          且"没命中回退父值"写在循环体内（起点低于下界时连回退都不发生）。
//    新版：for (c = a[x-1]-3; -1 < c; c--)       下界放宽到 0，
//          回退判断移到循环外 if (c == -1)。
//  步骤 1（把末元素拉回父值）、步骤 3（按段复制）以及其余协议外壳完全一致。
// ============================================================================
#include "../common.h"

static const int BIAS = 1;

void name0() { puts("Parented Predecessor Sequence 4"); }

void limit(const char *s)      { seqLimit(atoi(s), BIAS); }
void type0(const char *s)      { seqType0(s, BIAS); }
void precursor(const char *s)  { seqPrecursor(s, BIAS); }
void compare0(const char *a, const char *b) { seqCompare(a, b, BIAS); }

static void Ex(int *a, int n) { ppsEx(a, n, DEC_SCAN_LE_WIDE, false); }

void expand(const char *ns, const char *seq) { seqExpand(ns, seq, BIAS, Ex); }

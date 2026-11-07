// ============================================================================
//  Parented Predecessor Sequence 4
//
//  2026-11-08：本文件已由 11/7 提供的第二份 exe.c 的复原实现取代。
//  旧的复原版（扫描下界 a[p]-1、回退写在循环体内）与用户提供的 exe
//  在命令 4 上有 53/546 条差异，已删除，不再保留为独立记号。
//
//  当前 Ex() 降级扫描：
//    for (c = a[x-1]-3; -1 < c; c--)      下界放宽到 0
//    if (c == -1) a[x-1] = a[p]            「没命中回退父值」移到循环外
//  步骤 1、步骤 3 与协议外壳与旧版逐字相同；name0() 保持 exe 原样。
//  完整对照见 docs/pps4-v2.md 与 docs/pps4-v2-changes/。
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

// ============================================================================
//  HIUN —— Hierarchial Increase Unit Notation
//  把序列压缩成「值 + 连续出现次数」的游程表(fd / cnt / pos)，
//  再按层级向上找够 span 层的祖先，作为复制起点。
//  ※ 控制流在反编译中带大量跳转标签，此处用 goto 逐条对齐还原。
// ============================================================================
#include "../common.h"

static const int BIAS = 0;

void name0() { puts("Hierarchial Increase Unit Notation"); }

void limit(const char *s)      { seqLimit(atoi(s), BIAS); }
void type0(const char *s)      { seqType0(s, BIAS); }
void precursor(const char *s)  { seqPrecursor(s, BIAS); }
void compare0(const char *a, const char *b) { seqCompare(a, b, BIAS); }

// [s,e] 内不存在比 a[s] 更小的值
static int minbtw(const int *a, int s, int e) {
    for (int c = s + 1;; c++) {
        if (e < c) return 1;
        if (!(a[s] <= a[c])) break;
    }
    return 0;
}
// [s,e] 内不存在比 a[e] 更大的值
static int maxbtw(const int *a, int s, int e) {
    for (int c = e - 1;; c--) {
        if (c < s) return 1;
        if (!(a[c] <= a[e])) break;
    }
    return 0;
}

static void Ex(int *a, int n) {
    int fd[1003], cnt[500], pos[500];
    memset(fd, 0, sizeof(fd));
    memset(cnt, 0, sizeof(cnt));
    memset(pos, 0, sizeof(pos));

    int top = 0;
    fd[0] = 1;
    cnt[0] = 1;
    for (int i = 1; i < x; i++) {
        if (a[i] == a[i - 1] + 1) {
            cnt[top]++;                       // 同一层的连续递增合成一个游程
        } else {
            top++;
            fd[top]  = a[i];
            cnt[top] = 1;
            pos[top] = i;
        }
    }

    int lo, span, k, hi;
    if (cnt[top] == 1) {
        int t = top;
        while (fd[top] <= fd[t]) t--;
        lo   = fd[t];
        hi   = (fd[top] - fd[t]) + 1;
        k    = t;
        span = fd[top] - fd[t];
    } else {
        lo   = fd[top];
        span = cnt[top] - 1;
        k    = top;
        hi   = cnt[top] - 1;
    }

    int start;
    if (span == 1) {
        int j = x - 2;
        while (a[x - 1] <= a[j]) j--;
        start = j;
    } else if (k == 0) {
        start = 0;
    } else {
        start = 1;
        while (start < span) {
            int t = k - 1;
            for (;;) {
                bool take;
                if (t < 0) { take = false; }
                else if ((fd[t] < lo) && (cnt[t] <= hi)) {
                    if (minbtw(a, pos[t], pos[k]) != 1) take = false;
                    else if (hi <= cnt[t]) {
                        if (lo - fd[t] < span) {
                            take = (maxbtw(a, pos[t], pos[hi + k - 1]) == 1);
                        } else take = false;
                    } else take = true;
                } else take = false;

                if (!take) { t--; continue; }
                if (start == 1) {
                    int u = 1;
                    while (minbtw(a, pos[u + t], x - 1) == 0) u++;
                    start = pos[u + t];
                }
                lo = fd[t];
                hi = cnt[t];
                k  = t;
                break;
            }
            if (t == -1) { start = 0; break; }
            start++;
        }
    }

    int L  = (x - 1) - start;
    int hi2 = a[x - 1], lo2 = a[start];
    for (int j = x - 1; j < n * L + x - 1; j++)
        a[j] = (hi2 - lo2) - 1 + a[j - L];
}

void expand(const char *ns, const char *seq) { seqExpand(ns, seq, BIAS, Ex); }

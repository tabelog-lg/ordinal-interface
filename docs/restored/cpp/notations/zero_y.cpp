// ============================================================================
//  0-Y Sequence
//  一维序列，元素为正整数（0 作结束哨兵，故不做 +1 偏移）
//  Ex() 是递归的：先给每个位置求「父」(pm) 与到父的落差 (fb)，
//  再对落差序列自身递归展开，最后把落差加回到祖先位置上。
// ============================================================================
#include "../common.h"

static const int BIAS = 0;

void name0() { puts("0-Y Sequence"); }

void limit(const char *s) {          // 0-Y 的 limit 只给一个元素 {1}
    int n = atoi(s);
    arout(seqLimitTwo(n), 0);
}
void type0(const char *s)      { seqType0(s, BIAS); }
void precursor(const char *s)  { seqPrecursor(s, BIAS); }
void compare0(const char *a, const char *b) { seqCompare(a, b, BIAS); }

static void Ex(int *a, int n) {
    int fb[SEQMAX];        // 到父的落差
    int an[1002];          // 父下标
    memset(fb, 0, sizeof(fb));
    memset(an, 0, sizeof(an));
    fb[0] = 1;
    an[0] = 0;

    for (int i = 1;; i++) {
        if (x <= i) {                       // 父表算完，开始真正的展开
            l = (x - 1) - an[x - 1];
            if (fb[x - 1] == 1) {           // 落差为 1：整段照抄
                for (int k = x - 1; k < l * n + x - 1; k++) a[k] = a[k - l];
            } else {                        // 否则先递归展开落差，再加回祖先
                Ex(fb, n);
                for (int k = x; k < l * n + x - 1; k++)
                    an[k] = (an[k - l] < an[x - l]) ? an[k - l] : an[k - l] + l;
                for (int k = x - 1; k < l * n + x - 1; k++)
                    a[k] = fb[k] + a[an[k]];
            }
            return;
        }
        if (a[i] == 1) {                    // 最小值：父记为空
            fb[i] = 1;
            an[i] = -1;
            pm[i] = -1;
        } else {
            for (int j = i; j >= 0; j--) {
                bool ok = false;
                if (a[j] < a[i]) ok = (pare(i, j, pm) == 1);
                if (ok) {
                    fb[i] = a[i] - a[j];
                    an[i] = j;
                    pm[i] = j + 1;
                    break;
                }
            }
        }
    }
}

void expand(const char *ns, const char *seq) {
    int n = atoi(ns);
    int *a = txar(seq, BIAS);
    int i = 1;
    while (a[i] != 0) i++;
    x = i;
    for (int k = 0; k < SEQMAX; k++) pm[k] = k;   // 父表初始化为自身
    if (n == 0) a[x - 1] = 0;
    else        Ex(a, n);
    arout(a, -BIAS);
}

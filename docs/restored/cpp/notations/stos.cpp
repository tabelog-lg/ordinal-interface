// ============================================================================
//  STOS —— Single Transfinity Ordinal Sequence
//  序列里允许 'w'（内部记作 -1）作为 transfinity 标记：
//    * 末元素 < 1（即 w）时：先抄前半段，再用递增正整数「顶」上去，
//      然后按 len = 2L+top-1 的布局在两端补 -1
//    * 否则按常规复制块
//  最后统一清理形如 [.. x, x-1, -1 ..] 的可消去片段
// ============================================================================
#include "../common.h"

// ---- 解析器：'w' -> -1（吃掉 "w," 两个字符），其余按整数读 ---------------
static int *txarSTOS(const char *s) {
    static int buf[501];
    memset(buf, 0, sizeof(buf));
    int len = (int)strlen(s), n = 0;
    for (int i = 0; i < len && n < SEQMAX;) {
        if (s[i] == 'w') { buf[n++] = -1; i += 2; }
        else {
            int v = atoi(s + i);
            buf[n++] = v;
            int step = (int)std::log10((double)(v * 100 + 1));
            i += (step > 0 ? step : 1);
        }
    }
    x = n;
    return buf;
}

// ---- 输出：<1 打印 w；w 后面还有元素时仍打逗号 --------------------------
static void aroutSTOS(const int *a) {
    if (a[0] == 0) { cout << '0' << endl; return; }
    for (int i = 0; a[i] != 0; i++) {
        if (a[i + 1] == 0 || a[i] < 1) {
            if (a[i + 1] == 0 || a[i] > -1) {              // -1 < a[i]，即 a[i] >= 0
                if (a[i] < 1) cout << 'w' << endl;
                else         cout << a[i] << endl;
            } else {
                cout << 'w' << ',';
            }
        } else {
            cout << a[i] << ',';
        }
    }
}

void name0() { puts("Single Transfinity Ordinal Sequence"); }

// limit: 直接拼字符串 "1,w,w,...,w"（与 seqLimit 一样带 off-by-one）
void limit(const char *s) {
    int n = atoi(s);
    string out = "1,";
    for (int i = 1;; i++) {
        if (n < i) break;
        out += 'w';
        out += ',';
    }
    out[out.size() - 1] = '\0';
    puts(out.c_str());
}

void type0(const char *s) {
    int *a = txarSTOS(s);
    int n = 0;
    while (a[n] != 0) n++;
    cout << (a[0] == 0 ? 1 : (a[n - 1] == 1 ? 2 : 3)) << endl;
}

void precursor(const char *s) {
    int *a = txarSTOS(s);
    int n = 1;
    while (a[n] != 0) n++;
    a[n - 1] = 0;
    aroutSTOS(a);
}

static void dlt(int *a, int i) {                 // 删除下标 i，其后左移
    for (int c = i; c < 500; c++) a[c] = a[c + 1];
}
static bool po(const int *a, int i) {            // i 右侧第一个非负值 <= a[i] ?
    int c = i;
    do { c++; } while (a[c] < 0);
    return a[c] <= a[i];
}

void compare0(const char *sa, const char *sb) {
    static int a[502];
    memset(a, 0, sizeof(a));
    int *p = txarSTOS(sa);
    int na = x;
    for (int i = 0; p[i] != 0; i++) a[i] = p[i];
    for (int c = na - 1; c > 0; c--)
        if (a[c + 1] == -1 && a[c - 1] == a[c] - 1) dlt(a, c);

    int *q = txarSTOS(sb);
    int nb = x;
    for (int c = nb - 1; c > 0; c--)
        if (q[c + 1] == -1 && q[c - 1] == q[c] - 1) dlt(q, c);

    int i = 0;
    while (a[i] == q[i]) i++;
    cout << (((a[i] == -1 || q[i] <= a[i]) && q[i] != -1) ? 1 : 2) << endl;
}

static void Ex(int *a, int n) {
    int fb[1001];
    memset(fb, 0, sizeof(fb));

    int i = x;
    if (a[x - 1] < 1) {
        do { i--; } while (a[i] == -1);
    } else {
        do {
            do { i--; } while (a[x - 1] <= a[i]);
        } while (a[i] < 0);
    }
    int L = (x - 1) - i;
    int len;

    if (a[x - 1] < 1) {                          // transfinity 分支
        for (int j = 0; j <= i; j++) fb[j] = a[j];
        int j;
        for (j = i + 1; j <= n + i; j++) fb[j] = fb[j - 1] + 1;
        int top = j - 1;
        fb[L + top - 1] = fb[top];
        int k = 1;
        for (;;) {
            if (L <= k) break;
            fb[k + L + top - 1] = -1;
            fb[(L + top - 1) - k] = -1;
            k++;
        }
        len = k + L + top - 1;
        for (int j2 = 0; j2 < 500; j2++) a[j2] = 0;
        for (int j2 = 0; j2 < 500; j2++) a[j2] = fb[j2];
    } else {                                     // 常规复制
        for (int j = x - 1; j < n * L + x - 1; j++) a[j] = a[j - L];
        len = n * L + x - 1;
    }

    // 清理：a[j+1] == -1 且 a[j-1] == a[j]-1 且 po() 成立则删掉该位
    for (int j = len; j > 0; j--)
        if (a[j + 1] == -1 && a[j - 1] == a[j] - 1 && po(a, j)) dlt(a, j);
}

void expand(const char *ns, const char *seq) {
    int n = atoi(ns);
    int *a = txarSTOS(seq);
    int i = 1;
    while (a[i] != 0) i++;
    x = i;
    if (n == 0) a[x - 1] = 0;
    else        Ex(a, n);
    aroutSTOS(a);
}

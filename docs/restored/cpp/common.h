// ============================================================================
//  Ordinal Notation Protocol 2  --  复原版共通框架
// ----------------------------------------------------------------------------
//  27 个 exe 由同一份骨架编译而来，区别只在「记号系统」本身：
//    * 一维序列类：内部用 int a[500]，以 0 作结束哨兵；
//      输入 "1,2,3" 由 txar() 解析（部分记号为留出 0 哨兵会整体 +1 存储，
//      输出时再 -1，见各文件的 BIAS 常量）。
//    * 二维矩阵类：内部用 int m[300][COLS]（Bashicu 系 COLS=20，
//      Row-Extend 系 COLS=40），x = 行数、y = 列数。
//    全局变量 x / y / l / pm[] 是各函数之间传递尺寸的「隐式参数」——
//    原程序就是这么写的，复原时保留以便对照反编译代码。
// ============================================================================
#pragma once
#include <iostream>
#include <string>
#include <cstring>
#include <cstdlib>
#include <cmath>
#include <vector>
using namespace std;

// ---------------------------- 全局状态 -------------------------------------
extern int x;            // 序列长度 / 矩阵行数
extern int y;            // 矩阵列数
extern int l;            // 展开步长（Y 系列、余数类）
extern int pm[500];      // Y 系列的父索引表
extern int s0[500];      // 空序列哨兵（全 0）
extern int ac[300][20];  // 矩阵类差分缓存

const int SEQMAX = 500;
const int ROWMAX = 300;

// ---------------------------------------------------------------------------
//  txar():  "12,3,45" -> int[501]，末尾补 0
//  bias=1 时每个元素 +1（把 0 让给结束哨兵），输出侧再 -1
//  步进用的是原程序的写法 (int)log10(v*100+1)，即「数字位数 + 1(逗号)」
//  注：原程序返回栈上局部数组（悬垂指针），此处改用静态缓冲，行为等价而无 UB
// ---------------------------------------------------------------------------
inline int *txar(const char *s, int bias = 0) {
    static int buf[501];
    memset(buf, 0, sizeof(buf));
    int len = (int)strlen(s), n = 0;
    for (int i = 0; i < len && n < SEQMAX;) {
        int v = atoi(s + i);
        buf[n] = v + bias;
        // 原程序直接 i += (int)log10(stored*100+1)：stored == 0 时步进为 0，
        // 会死循环并把后续元素全部冲成 0（原 exe 里还会写越界）。
        // 按「数字位数 + 1 个分隔符」的本来语义，stored == 0 时步进应为 2。
        int stored = v + (bias ? 1 : 0);
        i += stored > 0 ? (int)std::log10((double)(stored * 100 + 1)) : 2;
        n++;
    }
    return buf;
}

// ---------------------------------------------------------------------------
//  txma():  "(0,0)(1,1)(2,2)" -> 行指针数组
//  ymode 0: 列数由第 2 行的字符串长度推出 (len>>1)+1   （Bashicu 系）
//  ymode 1: 列数由第 2 行最后一个非 0 列推出           （LELS）
//  ymode 2: 不推断（Row-Extend 用固定 COLS，行内变长）
// ---------------------------------------------------------------------------
template <int C>
inline void txma(const char *s, int m[ROWMAX][C], int &rows, int &cols, int ymode) {
    static char buf[10000];
    char cell[64];
    memset(m, 0, sizeof(int) * ROWMAX * C);
    strcpy(buf, s);
    rows = 0;
    for (int r = 0; r < ROWMAX; r++) {
        char *p = strchr(buf, '(');
        if (!p) break;
        memset(cell, 0, sizeof(cell));
        int k = 0;
        while (true) {
            p++;
            char *q = strchr(buf, ')');
            if (q <= p) break;
            cell[k++] = *p;
        }
        int *row = txar(cell);
        for (int j = 0; j < C; j++) m[r][j] = row[j];
        rows++;
        if (rows == 2) {
            if (ymode == 0) cols = ((int)strlen(cell) >> 1) + 1;
            if (ymode == 1) { int t = C - 1; while (t > 0 && m[1][t] == 0) t--; cols = t + 2; }
        }
        *strchr(buf, '(') = ',';
        char *q = strchr(buf, ')');
        if (!q || q[1] == '\0') break;
        *q = ',';
    }
}

// ---------------------------------------------------------------------------
//  输出
// ---------------------------------------------------------------------------
// 序列：a[i]+off，逗号分隔；空则输出 0
inline void arout(const int *a, int off = 0) {
    if (a[0] == 0) { cout << '0' << endl; return; }
    for (int i = 0; a[i] != 0; i++) {
        cout << (a[i] + off);
        if (a[i + 1] == 0) cout << endl; else cout << ',';
    }
}

template <int C>
inline void arow(int m[ROWMAX][C], int r, int cols) {
    cout << '(';
    for (int j = 0; j < cols; j++) {
        cout << m[r][j];
        cout << (j == cols - 1 ? ')' : ',');
    }
}

template <int C>
inline void maout(int m[ROWMAX][C], int rows, int cols) {
    for (int r = 0; r < rows; r++) arow<C>(m, r, cols);
    cout << endl;
}

// ---------------------------------------------------------------------------
//  VB 兼容层（第二批 VB.NET 版的 3 个记号用）
//  Strings.Mid(s, start, len) 是 1-based；越界返回空串（原程序会抛异常，
//  这里按「扫描到头即停」处理，行为在合法输入上完全一致）
// ---------------------------------------------------------------------------
inline string vmid(const string &s, int start, int len) {
    if (start < 1) start = 1;
    int i = start - 1;
    if (i >= (int)s.size() || len <= 0) return "";
    int n = len;
    if (n > (int)s.size() - i) n = (int)s.size() - i;
    return s.substr(i, n);
}
inline int vasc(const string &c) { return c.empty() ? 0 : (unsigned char)c[0]; }
inline int vmidInt(const string &s, int start, int len) {
    string t = vmid(s, start, len);
    return t.empty() ? 0 : atoi(t.c_str());
}

// ---------------------------------------------------------------------------
//  小工具
// ---------------------------------------------------------------------------
inline int max2(int a, int b) { return a < b ? b : a; }

// 字典序比较两行（返回 -1 / 0 / 1）
inline int comp(const int *a, const int *b, int lim = 300) {
    int j = 0;
    while (j < lim && a[j] == b[j]) j++;
    if (a[j] < b[j]) return -1;
    if (b[j] < a[j]) return 1;
    return 0;
}

// ---------------------------------------------------------------------------
//  一维序列类的通用外壳（limit / type0 / precursor / expand / compare0）
// ---------------------------------------------------------------------------
// limit: 输出 1,2,...,n（原程序 while(i<n) 写成 while(!(n<i))，会多吐一个元素，
//        这里照原样保留该 off-by-one，便于与 exe 输出逐字节比对）
inline void seqLimit(int n, int bias) {
    static int a[501];
    memset(a, 0, sizeof(a));
    for (int i = 0;; i++) {
        if (n < i) break;
        a[i] = i + 1;
    }
    arout(a, -bias);
}

// limit（MFSS 变体）：不多吐元素
inline void seqLimitExact(int n, int bias) {
    static int a[501];
    memset(a, 0, sizeof(a));
    a[0] = 1;
    for (int i = 1;; i++) {
        if (n <= i) break;
        a[i] = i + 1;
    }
    arout(a, -bias);
}

// 第 a 项 = 1,a+1（例如 (0) 1,1  (1) 1,2  (2) 1,3）
// —— 0-Y / 0-Y 超无提升 / Coprime / 简化 -2-Y / 余数类 这 5 个记号的
//    「最大序数的基本列」就是这个，由源 exe 实测确认。
inline int *seqLimitTwo(int n) {
    static int a[501];
    memset(a, 0, sizeof(a));
    a[0] = 1;
    a[1] = n + 1;
    return a;
}

// type0: 空->1；末元素为最小值->2（后继）；否则->3（极限）
inline void seqType0(const char *s, int bias) {
    int *a = txar(s, bias);
    int n = 0;
    while (a[n] != 0) n++;
    int t;
    if (a[0] == 0)              t = 1;
    else if (a[n - 1] == 1)     t = 2;
    else                        t = 3;
    cout << t << endl;
}

// precursor: 去掉末元素（长度为 1 时输出空序列）
inline void seqPrecursor(const char *s, int bias) {
    int *a = txar(s, bias);
    int n = 1;
    while (a[n] != 0) n++;
    x = n;
    a[n - 1] = 0;
    if (x == 1) arout(s0, -bias);
    else        arout(a, -bias);
}

// expand: n==0 时直接去尾（取前驱），否则调用该记号的 Ex()
inline void seqExpand(const char *ns, const char *seq, int bias, void (*Ex)(int *, int)) {
    int n = atoi(ns);
    int *a = txar(seq, bias);
    int i = 1;
    while (a[i] != 0) i++;
    x = i;
    if (n == 0) a[x - 1] = 0;
    else        Ex(a, n);
    arout(a, -bias);
}

// compare0: 逐位比较，a<b 输出 2，否则输出 1
inline void seqCompare(const char *sa, const char *sb, int bias) {
    static int a[502];
    memset(a, 0, sizeof(a));
    int *p = txar(sa, bias);
    int i;
    for (i = 0; p[i] != 0; i++) a[i] = p[i];
    int *q = txar(sb, bias);
    for (i = 0; a[i] == q[i]; i++) {}
    cout << (a[i] < q[i] ? 2 : 1) << endl;
}

// ---------------------------------------------------------------------------
//  二维矩阵类的通用外壳
// ---------------------------------------------------------------------------
template <int C>
inline void matrixType0(const char *s, int m[ROWMAX][C], int ymode) {
    int rows = 0, cols = 0;
    if (strlen(s) < 3) { cout << '1' << endl; return; }   // "()" 视作空
    txma<C>(s, m, rows, cols, ymode);
    x = rows; y = cols;
    bool allzero = true;
    for (int j = 0; j < y; j++) if (m[x - 1][j] != 0) allzero = false;
    cout << (allzero ? '2' : '3') << endl;
}

template <int C>
inline void matrixPrecursor(const char *s, int m[ROWMAX][C], int ymode, int dy = 0) {
    int rows = 0, cols = 0;
    txma<C>(s, m, rows, cols, ymode);
    x = rows; y = cols;
    if (x == 1) cout << '0' << endl;
    else        maout<C>(m, x - 1, y + dy);
}

// ===========================================================================
//  Parented Predecessor Sequence 家族（PrSS / PPS2 / PPS3 / PPS4 及 4 个弱化版）
//  七份 exe 的 Ex() 骨架完全相同，只有两处不同：
//    (a) 末元素的「降级」方式  -> decMode
//    (b) 提升点是否再抬一档    -> liftMode
// ===========================================================================
enum DecMode {
    DEC_MINUS1 = 0,   // PPS2 / PPS3：a[x-1] -= 1
    DEC_SCAN_LE,      // PPS4        ：向下扫到 a[c] <= a[p]
    DEC_SCAN_EQ,      // weak / third：向下扫到 a[c] == a[p]
    DEC_SCAN_EQ_SKIP  // second / extremely weak：同上，且遇更小值直接跳到边界
};

inline void ppsEx(int *a, int n, DecMode decMode, bool liftMode) {
    int v = a[x - 1];        // 末元素（存储值，真实值 = v-1）
    int p = v - 2;           // 父下标
    int L = (x - 1) - p;     // 每一段的长度

    // --- 步骤 1：若末元素与其父之间存在与父同值的元素，先把末元素拉回父值 ---
    for (int i = x - 2; i > p; i--)
        if (a[i] == a[p]) a[x - 1] = a[p];

    // --- 步骤 2：末元素降级 ---
    if (a[x - 1] != a[p]) {
        switch (decMode) {
        case DEC_MINUS1:
            a[x - 1] -= 1;
            break;
        default:
            for (int c = a[x - 1] - 3; a[p] - 1 <= c; c--) {
                bool hit = (decMode == DEC_SCAN_LE) ? (a[c] <= a[p]) : (a[c] == a[p]);
                if (hit) { a[x - 1] = c + 2; break; }
                if (decMode == DEC_SCAN_EQ_SKIP && a[c] < a[p]) c = a[p] - 1;
                if (c == a[p] - 1) a[x - 1] = a[p];
            }
            break;
        }
    }

    // --- 步骤 3：按段复制 n 次 ---
    for (int c = 0; c < n; c++) {
        for (int j = 0; j < L; j++) {
            int i = x - 1 + c * L + j;
            if ((i - p) % L == 0) {                 // 提升点
                if (!liftMode) a[i + L] = a[i];
                else if (a[x - 1] == a[p]) a[i + L] = a[i];
                else                      a[i + L] = a[i] + L;
            } else if (v - 1 < a[i - L]) {          // 越过末元素量级的项抬升
                a[i] = a[i - L] + L;
            } else {
                a[i] = a[i - L];
            }
        }
    }
    a[n * L + x - 1] = 0;                           // 结束哨兵
}

// ---------------------------------------------------------------------------
//  二维矩阵类的比较：先逐行比，行数更多者更大
// ---------------------------------------------------------------------------
template <int C>
inline void matrixCompare(const char *sa, const char *sb, int m[ROWMAX][C], int ymode) {
    static int buf[ROWMAX * C + 300];            // A 的副本（多留 300 防 comp 越界）
    static int mb[ROWMAX * C + 300];             // B
    if (strlen(sb) < 3)  { cout << '1' << endl; return; }
    if (strlen(sa) <= 2) { cout << '2' << endl; return; }

    int rowsA = 0, colsA = 0, rowsB = 0, colsB = 0;
    memset(buf, 0, sizeof(buf));
    memset(mb, 0, sizeof(mb));
    txma<C>(sa, m, rowsA, colsA, ymode);
    for (int r = 0; r < ROWMAX; r++)
        for (int j = 0; j < C; j++) buf[r * C + j] = m[r][j];
    txma<C>(sb, m, rowsB, colsB, ymode);
    for (int r = 0; r < ROWMAX; r++)
        for (int j = 0; j < C; j++) mb[r * C + j] = m[r][j];

    int i = 0;
    while (comp(&mb[i * C], &buf[i * C], 300) == 0 && i < max2(rowsB, rowsA)) i++;
    int r = comp(&mb[i * C], &buf[i * C], 300);
    if (r != -1 && (r != 0 || rowsA < rowsB)) cout << '2' << endl;
    else                                      cout << '1' << endl;
}

// ---------------------------------------------------------------------------
//  pare(): Y 系列用——沿 pm 链从 i 往上走，判断 j 是否为 i 的祖先
// ---------------------------------------------------------------------------
inline int pare(int i, int j, int *pm) {
    int c = i;
    do {
        if (j == pm[c] - 1) return 1;
        c = pm[c] - 1;
    } while (-1 < c);
    return 0;
}

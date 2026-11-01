// ============================================================================
//  Remainder Retention Sequence System
//  ※ 本 exe 与其余 26 个不同：txar()/arout() 都从下标 1 开始
//    （下标 0 恒为 0，只作占位），且输出用空格分隔而不是逗号。
//    序列每位存一个 (商, 余数)：a[i] = a[父] * 商 + 余数，
//    展开时保留余数、只累加商，这就是 "remainder retention"。
// ============================================================================
#include "../common.h"
#include <utility>
using namespace std;

// ---- 1 起址的解析器（对应本 exe 的 txar） -------------------------------
static int *txar1(const char *s) {
    static int buf[501];
    memset(buf, 0, sizeof(buf));
    int len = (int)strlen(s), n = 1;
    for (int i = 0; i < len && n < SEQMAX;) {
        int v = atoi(s + i);
        buf[n++] = v;
        int step = (int)std::log10((double)(v * 100 + 1));   // 位数 + 分隔符
        i += (step > 0 ? step : 1);
    }
    return buf;
}

// ---- 1 起址、空格分隔的输出（对应本 exe 的 arout） -----------------------
static void arout1(const int *a) {
    if (a[1] == 0) { cout << '0' << endl; return; }
    for (int i = 1; a[i] != 0; i++)
        cout << a[i] << (a[i + 1] == 0 ? '\n' : ' ');
}

void name0() { puts("Remainder Retention Sequence System"); }

// 第 a 项 = "1 a+1"（1 起址 + 空格分隔）：(0) 1 1  (1) 1 2  (2) 1 3
void limit(const char *s) {
    static int a[SEQMAX];
    memset(a, 0, sizeof(a));
    int n = atoi(s);
    a[1] = 1;
    a[2] = n + 1;
    arout1(a);
}

void type0(const char *s) {
    int *a = txar1(s);
    int n = 1;
    while (a[n] != 0) n++;
    cout << (a[1] == 0 ? 1 : (a[n - 1] == 1 ? 2 : 3)) << endl;
}

void precursor(const char *s) {
    int *a = txar1(s);
    int n = 1;
    while (a[n] != 0) n++;
    a[n - 1] = 0;
    arout1(a);
}

void compare0(const char *sa, const char *sb) {
    static int a[502];
    memset(a, 0, sizeof(a));
    int *p = txar1(sa);
    for (int i = 1; p[i] != 0; i++) a[i] = p[i];
    int *q = txar1(sb);
    int i = 0;
    while (a[i] == q[i]) i++;
    cout << (a[i] < q[i] ? 2 : 1) << endl;
}

static void Ex(int *a, int n) {
    static int par[1000];
    static pair<int, int> pr[5000];          // (商, 余数)
    memset(par, 0, sizeof(par));

    x = x - 1;                               // 末位下标
    a[x] = a[x] - 1;                         // 末元素 -1
    pr[1] = make_pair(1, 0);                 // 首位：商 1 余 0

    // 父 = 前面最后一个 <= 自己的位置；同时记下 (商, 余)
    for (int i = 2; i <= x; i++)
        for (int j = 1; j < i; j++)
            if (a[j] <= a[i]) {
                par[i] = j;
                pr[i] = make_pair(a[i] / a[j], a[i] % a[j]);
            }

    // 沿父链上溯，直到 (商,余) 不再变小
    int k = par[x];
    while (k != 0 && pr[x] < pr[k]) k = par[k];
    int base = k;

    int diff = pr[x].first - pr[base].first;
    int i = x;
    // ★ 复制段是 [base+1, x]，段长 L = x - base；共复制 n-1 轮。
    //   新下标 i 与源下标 j 的间距恒为 c*L（与段内位置无关），
    //   所以父指针平移 (i - j) 即可。
    //   反编译产物里这一处的下标推算不可靠，按源 exe 实测
    //   （"1 2" 的基本列 = 1 / 1 1 / 1 1 1 / 1 1 1 1 ...）定此处。
    for (int c = 1; c < n; c++)
        for (int j = base + 1; j <= x; j++) {
            i++;
            par[i] = par[j] + (i - j);
            pr[i]  = pr[j];
            pr[i].first += diff * c;
            a[i] = a[par[i]] * pr[i].first + pr[i].second;
        }
    x = i - 2;
}

void expand(const char *ns, const char *seq) {
    int n = atoi(ns);
    int *a = txar1(seq);
    int i = 1;
    while (a[i] != 0) i++;
    x = i;
    if (n == 0) a[x - 1] = 0;
    else        Ex(a, n);
    arout1(a);
}

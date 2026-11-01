// ============================================================================
//  LPrSS —— Long Primitive Sequence System
//  来源：LPrSS.exe 的反编译产物（VB.NET）
//  与 KP Hydra 是同一套展开规则，只是把 hydra 的括号串换成了「逗号分隔整数」，
//  所以能容纳任意大的元素值（"long"）：
//    limit(n)      = "1,n+1"
//    type0/precursor 都按字符串处理
//    expand        = 解析成 int[] -> 标准 PrSS 展开 -> 拼回字符串
// ============================================================================
#include "../common.h"

void name0() { puts("Long Primitive Sequence System"); }

void limit(const char *s) { cout << "1," << (atoi(s) + 1) << endl; }

void type0(const char *s0) {
    string s = s0;
    if (s == "0") { cout << '1' << endl; return; }
    if (s == "1") { cout << '2' << endl; return; }
    if (vmid(s, (int)s.size() - 1, 2) == ",1") { cout << '2' << endl; return; }
    cout << '3' << endl;
}

void precursor(const char *s0) {
    string s = s0;
    if (s == "1") { cout << '0' << endl; return; }
    cout << vmid(s, 1, (int)s.size() - 2) << endl;
}

// ---- Function2：字符串 -> int[]（"0" 视作空序列） -------------------------
static vector<int> parse(const string &s) {
    if (s == "0") return vector<int>();
    int cnt = 0;
    for (int i = 1; i <= (int)s.size(); i++)
        if (vmid(s, i, 1) == ",") cnt++;
    vector<int> a(cnt + 1);
    int i0 = 1, i1 = 1;
    for (int k = 0; k < (int)a.size(); k++) {
        while (!((int)s.size() < i1 || vmid(s, i1, 1) == ",")) i1++;
        a[k] = vmidInt(s, i0, i1 - i0);
        i1++;
        i0 = i1;
    }
    return a;
}

// ---- Function3：int[] -> 字符串 ------------------------------------------
static string render(const vector<int> &a) {
    if (a.empty()) return "0";
    string t;
    for (int v : a) { t += to_string(v); t += ','; }
    return vmid(t, 1, (int)t.size() - 1);
}

// ---- Function4：PrSS 展开 -------------------------------------------------
static vector<int> expandArr(int n, const vector<int> &b) {
    int i = (int)b.size() - 2;
    while (i >= 0 && b[i] >= b.back()) i--;      // 向左找第一个小于末元素的
    if (i < 0) return b;                         // 末元素已是最小值：原程序在此越界抛异常
    int delta = b.back() - b[i] - 1;
    int L = (int)b.size() - i - 1;               // 段长
    vector<int> r((int)b.size() + L * n - 2 + 1);
    for (int j = 0; j <= (int)b.size() - 2; j++) r[j] = b[j];
    for (int j = (int)b.size() - 1; j <= (int)r.size() - 1; j++)
        r[j] = r[j - L] + delta;
    return r;
}

void expand(const char *ns, const char *seq) {
    int n = atoi(ns);
    vector<int> a = parse(seq);
    if (a.empty()) { cout << '0' << endl; return; }
    cout << render(expandArr(n, a)) << endl;
}

void compare0(const char *sa, const char *sb) {
    vector<int> A = parse(sa), B = parse(sb);
    int i = 0;
    for (;;) {
        if ((int)B.size() == i) { cout << '1' << endl; return; }
        if ((int)A.size() == i) { cout << '2' << endl; return; }
        if (A[i] < B[i])        { cout << '2' << endl; return; }
        if (A[i] > B[i])        { cout << '1' << endl; return; }
        i++;
    }
}

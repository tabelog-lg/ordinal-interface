// ============================================================================
//  KP Hydra —— Simplified Primitive Sequence
//  来源：KP Hydra.exe 的反编译产物（VB.NET）
//  序列用纯括号串表示：每个 '(' 是一个元素，嵌套深度即元素的值。
//    limit(0) = "()"   limit(1) = "(())"   limit(2) = "((()))"   （= 1 / 1,2 / 1,2,3）
//  展开：找到末元素的父（它左边那个 '('），把「父 + 一个闭合」当作一个片段，
//        复制 n+1 份（第 1 份替换掉原来的末元素，其余 n 份追加）。
// ============================================================================
#include "../common.h"

void name0() { puts("Simplified Primitive Sequence"); }

void limit(const char *s) {
    int n = atoi(s);
    string r;
    for (int i = 0; i <= n; i++) r += '(';
    for (int j = 0; j <= n; j++) r += ')';
    cout << r << endl;
}

void type0(const char *s0) {
    string s = s0;
    // Mid(s, s.Length - 1, 1)：倒数第二个字符。是 '(' 说明末元素是叶子 -> 后继
    if (s == "0") { cout << '1' << endl; return; }
    cout << (vmid(s, (int)s.size() - 1, 1) == "(" ? '2' : '3') << endl;
}

void precursor(const char *s0) {
    string s = s0;
    if (s == "()") { cout << '0' << endl; return; }
    cout << vmid(s, 1, (int)s.size() - 2) << endl;
}

void compare0(const char *sa, const char *sb) {
    string A = sa, B = sb;
    int i = 2;                                   // 跳过第 1 个字符（恒为 '('）
    for (;;) {
        if (i > (int)B.size()) { cout << '1' << endl; return; }
        if (i > (int)A.size()) { cout << '2' << endl; return; }
        if (vmid(A, i, 1) == "(" && vmid(B, i, 1) == ")") { cout << '1' << endl; return; }
        if (vmid(B, i, 1) == "(" && vmid(A, i, 1) == ")") { cout << '2' << endl; return; }
        i++;
    }
}

void expand(const char *ns, const char *seq) {
    int n = atoi(ns);
    string s = seq;
    int L = (int)s.size();

    int i1 = L - 2;                              // 从倒数第二个字符起
    while (i1 > 0 && vmid(s, i1, 1) == ")") i1--;   // 向左跳过闭合，落到最后一个 '('
    int i2 = i1, i3 = 1;
    while (i3 > 0 && i2 > 1) {                   // 括号配对，找到它左边的父 '('
        i2--;
        if (vmid(s, i2, 1) == ")") i3++;
        else                       i3--;
    }

    string seg = vmid(s, i2, i1 - i2) + ")";     // 父副本 + 闭合
    string out = vmid(s, 1, i2 - 1);             // 前缀
    for (int k = 0; k <= n; k++) out += seg;
    out += vmid(s, i1 + 3, L - i1 - 2);          // 后缀
    cout << out << endl;
}

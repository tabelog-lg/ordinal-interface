// ============================================================================
//  PSS Hydra —— Simplified Pair Sequence
//  来源：PSS Hydra.exe 的反编译产物（VB.NET）
//  序列写成 "0(1(2()))" 这种嵌套串：每个元素是一个十进制数 + '('，
//  闭合括号统一堆在末尾（limit(n) = "0(1(2(...n())))"）。
//  展开：取末元素的值 v，向左扫到「值 >= v 的祖先」作为父，
//        把「父元素 + 其后内容」当片段复制 n+1 份，再补上闭合括号。
//        v == 0 时走另一条分支：按括号配对找父，片段末尾补一个 ')'。
// ============================================================================
#include "../common.h"

void name0() { puts("Simplified Pair Sequence"); }

void limit(const char *s) {
    int n = atoi(s);
    string r;
    for (int i = 0; i <= n; i++) { r += to_string(i); r += '('; }
    for (int j = 0; j <= n; j++) r += ')';
    cout << r << endl;
}

void type0(const char *s0) {
    string s = s0;
    if (s == "0") { cout << '1' << endl; return; }
    cout << (vmid(s, (int)s.size() - 1, 1) == "(" ? '2' : '3') << endl;
}

void precursor(const char *s0) {
    string s = s0;
    if (s == "0()") { cout << '0' << endl; return; }
    cout << vmid(s, 1, (int)s.size() - 3) << endl;
}

void compare0(const char *sa, const char *sb) {
    string A = sa, B = sb;
    int i = 3;                                   // 跳过首元素 "0("
    for (;;) {
        if (i > (int)B.size()) { cout << '1' << endl; return; }
        if (i > (int)A.size()) { cout << '2' << endl; return; }
        if (vmid(A, i, 1) == ")") {              // A 这一位已结束
            if (vmid(B, i, 1) == ")") { i++; continue; }
            cout << '2' << endl; return;
        }
        if (vmid(B, i, 1) == ")") { cout << '1' << endl; return; }
        int k = i;                               // 两边都还是数字：各读一个元素值
        while (k <= (int)A.size() && vmid(A, k, 1) != "(") k++;
        int va = vmidInt(A, i, k - i);
        k = i;
        while (i <= (int)B.size() && vmid(B, i, 1) != "(") i++;
        int vb = vmidInt(B, k, i - k);
        if (va < vb) { cout << '2' << endl; return; }
        if (va > vb) { cout << '1' << endl; return; }
        i++;
    }
}

void expand(const char *ns, const char *seq) {
    int n = atoi(ns);
    string s = seq;
    int L = (int)s.size();

    int i1 = L - 2;
    while (i1 > 0 && vmid(s, i1, 1) == ")") i1--;   // 跳过尾部闭合，落到最后一个 '('
    int i7 = i1;
    i1--;
    while (i1 > 0 && vasc(vmid(s, i1, 1)) > 45) i1--;   // 再跳过末元素的数字
    i1++;
    int v  = vmidInt(s, i1, i7 - i1);            // 末元素的值
    int i2 = i1;                                 // 末元素数字的起始位置

    string out;
    if (v > 0) {
        int i4 = 0, i5 = 0;                      // i4 = 候选父的值，i5 = 括号深度计数
        while (i5 <= i4 && i1 > 1) {
            i1--;
            string c = vmid(s, i1, 1);
            if (c == "(") {
                i5++;
                if (i5 > i4) {
                    int i6 = i1;
                    i1--;
                    while (i1 > 0 && vasc(vmid(s, i1, 1)) > 45) i1--;
                    i1++;
                    i4 = vmidInt(s, i1, i6 - i1);
                    i4 = (i4 < v) ? 0 : i5;      // 值不够大 -> 继续往左找
                }
            } else if (c == ")") {
                i5--;
            }
        }
        string seg = vmid(s, i1, i2 - i1);       // 从父开始到末元素之前
        out = vmid(s, 1, i1 - 1);
        for (int k = 0; k <= n; k++) out += seg;
        string tail = vmid(s, L - i5 + 1, i5);   // 末尾的 i5 个闭合
        for (int k = 1; k <= n; k++) out += tail;
        out += vmid(s, i7 + 2, L - i7 - 1);
    } else {
        int t = 1;                               // 按括号配对找父
        while (t > 0 && i1 > 0) {
            i1--;
            string c = vmid(s, i1, 1);
            if (c == "(")      t--;
            else if (c == ")") t++;
        }
        i1--;
        while (i1 > 0 && vasc(vmid(s, i1, 1)) > 45) i1--;
        i1++;
        string seg = vmid(s, i1, i2 - i1) + ")";
        out = vmid(s, 1, i1 - 1);
        for (int k = 0; k <= n; k++) out += seg;
        out += vmid(s, i7 + 3, L - i7 - 2);
    }
    cout << out << endl;
}

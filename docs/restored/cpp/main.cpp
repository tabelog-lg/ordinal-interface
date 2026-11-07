// ============================================================================
//  Ordinal Notation Protocol 2 —— 统一的交互外壳（30 个 exe 共用同一份 main）
//
//  启动后打印协议名与记号名，然后循环读命令：
//    1 <n>                 -> limit(n)      该记号的第 n 个「极限」元素
//    2 <seq>               -> type0(seq)    1=零 / 2=后继 / 3=极限
//    3 <seq>               -> precursor     去掉末元素
//    4 <n> <seq>           -> expand        把 seq 展开 n 段
//    5 <seqA> <seqB>       -> compare0      比较大小（输出 1 = A≥B，2 = A<B）
// ============================================================================
#include "common.h"

// 全局状态（各记号实现与外壳之间靠它们传递尺寸）
int x = 0, y = 0, l = 0;
int pm[SEQMAX];
int s0[SEQMAX];
int ac[300][20];

// 由各记号文件提供
void name0();
void limit(const char *);
void type0(const char *);
void precursor(const char *);
void expand(const char *, const char *);
void compare0(const char *, const char *);

int main() {
    puts("Ordinal Notation Protocol 2");
    name0();

    string mode, a, b;
    for (;;) {
        x = 0;
        y = 0;
        if (!getline(cin, mode)) break;
        if (mode.empty()) continue;
        switch (mode[0]) {
        case '1':
            if (!getline(cin, a)) return 0;
            limit(a.c_str());
            break;
        case '2':
            if (!getline(cin, a)) return 0;
            type0(a.c_str());
            break;
        case '3':
            if (!getline(cin, a)) return 0;
            precursor(a.c_str());
            break;
        case '4':
            if (!getline(cin, a)) return 0;      // 段数 n
            if (!getline(cin, b)) return 0;      // 序列 / 矩阵
            expand(a.c_str(), b.c_str());
            break;
        case '5':
            if (!getline(cin, a)) return 0;      // A
            if (!getline(cin, b)) return 0;      // B
            compare0(a.c_str(), b.c_str());
            break;
        }
    }
    return 0;
}

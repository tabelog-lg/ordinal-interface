// ============================================================================
//  Bashicu 系矩阵记号共用的「父 / 祖先判定」
//  矩阵按 int m[300][C] 展平存储，par() 返回指向父元素的指针，
//  k 是该元素在展平数组中的下标（原程序用「指针 - 基址」推算行号）。
// ============================================================================
#pragma once
#include "common.h"

// ---------------------------------------------------------------------------
//  par(): 求 cell 的父
//    * 第 0 列：向上（行号减小）找第一个严格更小的元素
//    * 其余列：先向左递归收集候选行，再向上取第一个「更小且行号在候选中」的
// ---------------------------------------------------------------------------
template <int C>
int *bmsPar(int *cell, int k, int *base) {
    int *q = cell;
    if (k % C == 0) {
        while (*cell <= *q) {
            q -= C;
            if (q < base) break;      // 原程序无此边界检查（走到矩阵上方即越界）
        }
    } else {
        int buf[301];
        memset(buf, 0, sizeof(buf));
        int c = 0;
        int *p = cell;
        while (base < p && p[-1] != 0) {
            q = bmsPar<C>(p - 1, k + (int)(p - cell) - 1, base);
            p = q + 1;
            c++;
            buf[c] = (int)(((int)(p - cell) + k) / C);
        }
        int n = c;
        int found = 0;
        for (p = cell; base < p; p -= C) {
            if (*p < *cell) {
                for (int i = n; i >= 0; i--)
                    if (((int)(p - cell) + k) / C == buf[i]) { found = 1; break; }
            }
            if (found) return p;
        }
    }
    return q;
}

// ---------------------------------------------------------------------------
//  asmt(): 判断 cell 所在的这一列是否「抬升」——
//          沿父链上溯，若链上出现目标行 target 则抬升 (1)，否则不抬 (0)
// ---------------------------------------------------------------------------
template <int C>
int bmsAsmt(int *cell, int target, int k, int *base) {
    int buf[301];
    memset(buf, 0, sizeof(buf));
    if (*cell != 0) {
        int *q = cell;
        int c = 0;
        while (base < q && *q != 0) {
            q = bmsPar<C>(q, k + (int)(q - cell), base);
            buf[c] = (int)(((int)(q - cell) + k) / C);
            if (*q == 0) {
                int v = (int)(((int)(q - cell) + k) / C);
                if (v != target && -1 < v - target) return 0;
            }
            c++;
        }
        for (int i = c + 1; i >= 0; i--)
            if (target == buf[i]) return 1;
    }
    return 0;
}

// 打印工作矩阵（展开结果）
template <int C>
inline void dumpMat(int w[ROWMAX][C], int rows, int cols) {
    for (int r = 0; r < rows; r++) arow<C>(w, r, cols);
    cout << endl;
}

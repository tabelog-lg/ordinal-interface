#!/usr/bin/env python3
"""审计 txar() 的步进公式：找出「原程序 flzero 版」与「旧复原版」何时分叉。

原程序（新版 exe.c 里的 flzero 揭示）：
    i += (int)log10((v + flzero(v)) * 100 + 1)     flzero(v) = (v == 0)
旧复原版（bias=1 时）：
    i += (int)log10((v + 1) * 100 + 1)
"""
import math

NAMES = ['mfss', 'pps2', 'pps3', 'pps4', 'pps4_weak', 'pps4_second',
         'pps4_third', 'pps4_extremely_weak', 'prss_parented', 'pps4_v2']


def step_orig(v):
    return int(math.log10((v + (1 if v == 0 else 0)) * 100 + 1))


def step_ours_bias1(v):
    stored = v + 1
    return int(math.log10(stored * 100 + 1)) if stored > 0 else 2


bad = [v for v in range(0, 2000) if step_orig(v) != step_ours_bias1(v)]
print('0..1999 中分叉的值:', bad, ' 共', len(bad), '个')
print('规律：全是 10^k - 1 ->', all(v in (9, 99, 999) for v in bad))
print('\n  v     原程序   旧复原版   bias=0（两式一致）')
for v in [0, 1, 8, 9, 10, 98, 99, 100, 998, 999, 1000]:
    a, b = step_orig(v), step_ours_bias1(v)
    print(f'  {v:4d}     {a}         {b}         {step_orig(v)}'
          + ('   <- 分叉' if a != b else ''))
print('\n受影响的 bias=1 记号（共 %d 个）:' % len(NAMES))
for n in NAMES:
    print('  ', n)

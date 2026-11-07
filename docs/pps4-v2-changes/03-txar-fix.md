# `txar()` 步进公式的修正

解析这版 exe.c 时顺带查出的一个**共通框架偏差**，与 PPS4 两版差异无关，
但影响 10 个记号。C++ `common.h` 与 TS `src/core/seq.ts` 两侧同步修好了。

## 线索：`flzero`

新版 exe.c 里有个独立函数：

```c
bool flzero(int param_1) { return param_1 == 0; }
```

它只出现在 8 个反编译产物里（PPS 全族 6 个 + Parented PrSS + PPS3），
其它 19 个 C++ exe.c 都没有。唯一调用点在 `txar()`：

```c
iVar2 = atoi(param_1 + local_20);
local_7f8[local_1c] = iVar2;                  // ← 此时还是解析值 v
iVar2 = local_7f8[local_1c];
bVar1 = flzero(local_7f8[local_1c]);          // flzero(v)
dVar4 = log10(((int)CONCAT71(extraout_var, bVar1) + iVar2) * 100 + 1);
       //      = log10((v + (v==0)) * 100 + 1)
local_20 = local_20 + (int)dVar4;             // 步进
local_7f8[local_1c] = local_7f8[local_1c] + 1;  // ← 这里才加 bias
```

**关键：步进用的是解析值 `v`（不含 bias），`v==0` 时抬成 1。**
`log10(1*100+1) = 2`，正好是「数字 `0` 一位 + 逗号一位」；
若直接 `log10(0*100+1) = 0`，`i` 不动就死循环 —— 这是原作者自己修 0 元素的手法。

## 偏差

共通框架之前写成：

```c
int stored = v + (bias ? 1 : 0);              // ← 错：把 bias 加进了步进参数
i += (int)log10(stored * 100 + 1);
```

bias=1 时 `stored = v+1`，于是 `v = 10^k - 1`（9 / 99 / 999）处多跳一位：

| v | 原程序 `(v+(v==0))*100+1` | 旧复原版 `(v+1)*100+1` | 后果 |
|---|---|---|---|
| 0 | 步进 2 | 2 | 一致 |
| 8 | 2 | 2 | 一致 |
| **9** | **2** | **3** | `9,1` 里的 `,1` 被跳过 |
| 10 | 3 | 3 | 一致 |
| **99** | **3** | **4** | 同上 |
| **999** | **4** | **5** | 同上 |

实测（命令 3 `precursor`）：`"9,1"` 在旧复原版里被解析成只有一个元素 `"9"`，
输出 `9`；修正后与原程序一致，输出 `9`（这个例子输出碰巧一样，
但 `"9,1,2"` 旧版给 `9`、修正后给 `9,1`，差异可见）。

0..1999 范围内分叉值只有 `[9, 99, 999]` 三个，全部是 `10^k - 1`。
审计脚本：`scripts/txar_step_audit.py`，原始输出见临时文件包
`05_pps4_v2/txar_step_audit.txt`。

## 影响范围

10 个 bias=1 记号：`mfss`、`pps2`、`pps3`、`pps4`、`pps4_weak`、
`pps4_second`、`pps4_third`、`pps4_extremely_weak`、`prss_parented`、
`pps4_v2`。触发条件是「元素值恰为 `10^k - 1` 且后面还有元素」。

bias=0 的记号行为不变：两式在 bias=0 时都是 `v + (v==0)`，
旧版那个 `stored > 0 ? ... : 2` 的兜底等价于 `v==0` 时步进 2。

## 修正后的代码

```c
// C++ common.h
int t = v + (v == 0 ? 1 : 0);
i += (int)std::log10((double)(t * 100 + 1));
```

```ts
// TS src/core/seq.ts
const t = v + (v === 0 ? 1 : 0);
i += Math.trunc(Math.log10(t * 100 + 1));
```

## 防回归

`tests/diff.cjs` 与 `tests/verify-plugins.mjs` 的序列语料里加了
`'9,1'`、`'9,1,2'`、`'0,9,1'`。加之前对拍 3640 条，加之后 5059 条，
全部 0 不一致；插件校验 1635 条 0 失败。

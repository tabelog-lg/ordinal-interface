# Parented Predecessor Sequence 4 —— 当前实现基准（原「另一版本」）

> **2026-11-08 状态更新**：仓库里原来的 `pps4`（11/1 那份 exe.c 的复原版）
> 与用户提供的 exe 在命令 4 上不符，已**删除**；本文所述 11/7 那份实现
> 已从 `pps4_v2` **提升为唯一的 `pps4`**。现在只有一个 PPS4 主记号，
> id / 文件名 / `name` 都是 `pps4`，注册表 31 → 30。
> 旧的 `pps4_v2` 条目、`src/notations/pps4_v2.ts`、
> `docs/restored/cpp/notations/pps4_v2.cpp` 均已移除。
>
> 本文保留两版对照的技术内容作为**判定依据**；文中「新版 / v2」指的就是当前 `pps4`。
> 完整归档见 [`pps4-v2-changes/`](./pps4-v2-changes/README.md)，
> 该目录是 2026-11-07 的历史快照，其中的 `pps4_v2` 路径不再代表当前状态。

2026-11-07 又给了一份 `Parented Predecessor Sequence 4.exe.c`（94,425 B，
覆盖掉 11/1 那份）。解析后确认：它是**同一个记号的另一个实现**，不是新记号，
也不是已有的 weak / second / third / extremely weak 四个变体中的任何一个。

**当前复原产物**：`src/notations/pps4.ts`、
`docs/restored/cpp/notations/pps4.cpp`（两者的 `Ex()` 都走 `DEC_SCAN_LE_WIDE`）。
旧的 `DEC_SCAN_LE` 模式（扫描下界 `a[p]-1`）已从共通框架删除，数值 1 留空号。

---

## 一、两版 exe.c 的差异

把两份反编译产物按函数切开比对，**除了 `Ex()` 之外逐字相同**
（`flzero` / `arout` / `txar` / `limit` / `type0` / `precursor` / `expand` /
`compare0` / `name0` / `main` / `precpr` 全都一样）。

`Ex()` 里也只差「步骤 2：末元素降级」这一段的循环边界：

```c
// ── 旧版（11/1，已删除）─────────────────────────────────────
for (local_c = a[x-1]-3; a[p]-1 <= local_c; local_c--) {
    if (a[local_c] <= a[p]) { a[x-1] = local_c+2; break; }
    if (local_c == a[p]-1) a[x-1] = a[p];       // 回退写在循环体内
}

// ── 新版（11/7，即当前 pps4）────────────────────────────────
for (local_c = a[x-1]-3; -1 < local_c; local_c--) {
    if (a[local_c] <= a[a[x-1]-2]) { a[x-1] = local_c+2; break; }
}
if (local_c == -1) a[x-1] = a[p];              // 回退移到循环外
```

两点说明：

1. **`a[a[x-1]-2]` 与旧版 `a[p]` 是同一个元素**。进入步骤 2 的前提是
   `a[x-1] != a[p]`，说明步骤 1 没有把末元素拉回父值，因此 `a[x-1]` 仍是原值
   `v`；而 `p = v - 2`，所以 `a[x-1]-2 == p`。这只是编译器把 `iVar2` 展开重写了，
   不是规则变化。
2. **真正的差别是下界**：旧版扫到 `a[p]-1` 就停，新版一路扫到下标 0。
   而且旧版的"没命中就回退父值"写在循环体内 —— 当起点 `v-3` 本来就小于
   `a[p]-1` 时循环一次都不跑，**连回退都不会发生**；新版把回退挪到循环外，
   只要没 `break` 就一定会回退。

其余部分完全一致：步骤 1（末元素与其父之间有同值元素时先拉回父值）、
步骤 3（按段长 `L = x-1-p` 复制 n 轮、越过量级的项抬升 `L`）、
末尾写 0 哨兵。

---

## 二、实测输出差异

拿两份复原版 C++ 可执行跑 546 条命令（命令 1~5 全覆盖）：

| 命令 | 差异条数 |
|---|---|
| 1 `limit` | 0 |
| 2 `type0` | 0 |
| 3 `precursor` | 0 |
| **4 `expand`** | **53** |
| 5 `compare0` | 0 |

**差异 100% 落在展开**，与"只有 `Ex()` 变了"互证。

典型例子（命令 4，格式 `n 输入`）：

| 输入 | 旧版（已删除） | 新版 = 当前 `pps4` |
|---|---|---|
| `1 · 0,1,2` | `0,1,2` | `0,1,1` |
| `2 · 0,1,2` | `0,1,2,2` | `0,1,1,1` |
| `1 · 0,1,2,3` | `0,1,2,3` | `0,1,2,2` |
| `1 · 0,1,2,3,4,5` | `0,1,2,3,4,5` | `0,1,2,3,4,4` |
| `1 · 0,1,0` | `0,1,0,3,4` | `0,1` |
| `2 · 0` | `0,0` | `0` |

为什么 `0,1,2` 会分叉：内部存储是 `1,2,3`（bias=1，0 让给结束哨兵），
`x=3`、`v=3`、`p=1`、`a[p]=2`，降级扫描起点 `c = v-3 = 0`。

- 旧版下界 `a[p]-1 = 1`，`1 <= 0` 不成立 → 循环不跑、也不回退 → 末元素保持 3。
- 新版下界 0 → 检查 `a[0]=1 <= a[p]=2` 命中 → 末元素改成 `0+2 = 2`（真实值 1）。

所以新版把末元素降级得更狠，展开结果整体偏"弱/短"。

> 这组期望值已固化在 `tests/verify_notations.mjs` 的 B 组：
> `pps4.fs(1,"0,1") = "0,0"`、`fs(1,"0,1,2") = "0,1,1"`、
> `fs(1,"0,1,2,3,4,5") = "0,1,2,3,4,4"`、`fs(1,"2,1") = "2,2"`。

---

## 三、命名

exe 里 `name0()` 打印的始终是 `Parented Predecessor Sequence 4`。
**2026-11-08 起** TS 侧的 `name` 也统一为 `Parented Predecessor Sequence 4`、
id 为 `pps4`、文件为 `pps4.ts`；C++ 复原版的 `name0()` 保持 exe 原样（无后缀）。

此前（11/7 那轮）为在记号列表里区分两版，TS 曾写成
`Parented Predecessor Sequence 4 (v2)`、id `pps4_v2`；该条目随旧版一并删除，
只有 [历史归档 `pps4-v2-changes/`](./pps4-v2-changes/README.md) 里还保留这些名字。

---

## 四、顺带修掉的一个框架偏差（解析新版时发现）

这版 exe.c 里有个 `bool flzero(int x) { return x == 0; }`，只出现在
PPS 系列 + Parented PrSS 这 8 个反编译产物里。`txar()` 用它算步进：

```c
bVar1 = flzero(a[n]);                       // a[n] 此时还是解析值 v（+1 在后面）
dVar4 = log10((v + bVar1) * 100 + 1);       // 即 log10((v + (v==0))*100+1)
i += (int)dVar4;
a[n] = a[n] + 1;                            // 这里才加 bias
```

也就是说原程序**用解析值 `v`（不含 bias）算步进**，`v==0` 时抬成 1，
避免 `log10(1)=0` 导致 `i` 不动而死循环 —— 这是原作者自己修 0 元素的方式。

之前的共通框架写成了 `(v + bias) * 100 + 1`，在 bias=1 时：

| v | 原程序步进 | 旧复原版步进 |
|---|---|---|
| 0 | 2 | 2 |
| 8 | 2 | 2 |
| **9** | **2** | **3** ← 多跳一位 |
| 10 | 3 | 3 |
| **99** | **3** | **4** ← 多跳一位 |

后果：`"9,1"` 被解析成只剩 `"9"`（后面的 `,1` 被跳过）。
只在元素值恰为 `10^k - 1` 且后面还有元素时触发，影响
`mfss`、`pps2`、`pps3`、`pps4` 全族、`prss_parented` 共 9 个 bias=1 记号
（11/7 那轮曾有 10 个，多出的 `pps4_v2` 现已并入 `pps4`）。

C++ `docs/restored/cpp/common.h` 与 TS `src/notations/core/seq.ts` 的 `txar()`
已同步改为 `const t = v + (v === 0 ? 1 : 0); i += trunc(log10(t*100+1));`。
对 bias=0 的记号行为不变（原本 v=0 也是兜底成 2）。

回归用例见 `tests/verify_notations.mjs` 的 A6 组；
历史归档里 `diff.cjs` / `verify-plugins.mjs` 语料加的
`'9,1'`、`'9,1,2'`、`'0,9,1'` 见
[`pps4-v2-changes/04-file-manifest.md`](./pps4-v2-changes/04-file-manifest.md)。

---

## 五、2026-11-08 的替换清单

| 动作 | 文件 |
|---|---|
| 删除旧记号 | `src/notations/pps4.ts`（旧内容）、`src/notations/pps4_v2.ts`、`docs/restored/cpp/notations/pps4_v2.cpp` |
| 提升为 `pps4` | `src/notations/pps4.ts`（新内容）、`docs/restored/cpp/notations/pps4.cpp` |
| 注册表 | `src/notations/index.ts`（31 → 30）、`src/engine/plugins.ts`（删 `pps4_v2` 名字与 BUILTINS 条目） |
| 共通框架 | `src/notations/core/seq.ts`、`docs/restored/cpp/common.h`：删 `DEC_SCAN_LE`，`DEC_SCAN_LE_WIDE` 成为 PPS4 唯一模式 |
| 测试 | `tests/verify_notations.mjs` 新增 A7 组并更新 B 组期望值（88 → 95 条） |
| 名字 | `name` = `Parented Predecessor Sequence 4`（无后缀），`check_names.mjs` 30 个一致 |

完整逐函数 diff、546 条对拍原始输出、`txar` 推导与改动文件副本仍逐字保留在
[`pps4-v2-changes/`](./pps4-v2-changes/README.md)；那是 11/7 的历史快照，
不代表当前路径与计数。

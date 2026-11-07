# Ordinal Notation Protocol 2 —— 反编译复原版

> 文档总导航：[`../../README.md`](../../README.md)；本目录的上级说明
> [`../README.md`](../README.md)；实现审查报告 [`../../reviews/README.md`](../../reviews/README.md)；
> 本轮修正取舍 [`../../IMPLEMENTATION-NOTES.md`](../../IMPLEMENTATION-NOTES.md)。

30 个记号程序复原成一个可以直接 `make` 的 C++ 工程（外加 3 份 C# 复原版）。
这批程序其实是**同一份骨架 + 30 个不同的「序数记号系统」**：外壳、解析、输出、
CRT/MinGW 运行时完全一致，差别只在 `Ex()`（展开规则）和少数几个辅助函数。
复原版把这个结构显式拆开：一份共通框架 + 30 个记号实现。

分两批进来：

* **第一批 27 个**：C++ / MinGW 编译的 exe，Ghidra 反编译产物（`.exe.c`）。
* **第二批 3 个**：VB.NET 编译的 exe，反编译成 C#（`.cs`）。协议与第一批完全一致，
  只是记号本身改用字符串表示（括号串 / 逗号串）。C++ 版见 `notations/kp_hydra.cpp`、
  `lprss.cpp`、`pss_hydra.cpp`；还原回原始语言的版本见同级目录 `../ONP2.NET/`。

```
ONP2/
├── Makefile                 # make 一次构建 30 个可执行到 bin/
├── main.cpp                 # 30 个 exe 共用的交互外壳
├── common.h                 # 共通框架：解析/输出/通用外壳/PPS 家族骨架
├── matrix_bms.h             # Bashicu 系矩阵记号的公共部分（父指针、差分）
├── notations/*.cpp          # 30 个记号，一个 exe 一个文件（含第二批 3 个的 C++ 移植）
├── test.py                  # 自洽性自检（5 项不变量 × 第一批 27 个）
├── tools/ref_vb.py          # 第二批 3 个：按 VB 1-based Mid 语义的直译（基准）
├── tools/check_vb.py        # 第二批 3 个：C++ 移植 vs VB 直译 的对拍
└── tools/scan_features.py   # 辅助审计：批量抽取反编译产物里的 txar/arout/limit 特征
```

第二批的 C# 复原版在同级目录 `ONP2.NET/`，三个独立工程，各自 `dotnet run`：

```
ONP2.NET/
├── SimplifiedPrimitiveSequence/     # 原 KP Hydra.exe
├── LongPrimitiveSequenceSystem/     # 原 LPrSS.exe
└── SimplifiedPairSequence/          # 原 PSS Hydra.exe
```

构建 / 使用：

```bash
make            # 构建 30 个可执行；make bin/zero_y 只构建一个
printf '4\n2\n1,2\n' | ./bin/zero_y
```

协议（**每个 token 单独一行**，与原始 exe 一致）：

| 命令 | 含义 | 输出 |
|---|---|---|
| `1` `<n>` | `limit` 第 n 个极限元素 | 序列 / 矩阵 |
| `2` `<seq>` | `type0` 类型 | 1=零 2=后继 3=极限 |
| `3` `<seq>` | `precursor` 去掉末元素 | 序列 / 矩阵 |
| `4` `<n>` `<seq>` | `expand` 展开 n 段（n=0 即取前驱） | 序列 / 矩阵 |
| `5` `<A>` `<B>` | `compare0` 比较 | 1 = A≥B，2 = A<B |

序列形如 `1,2,3`；矩阵形如 `(0,0)(1,1)(2,2)`；STOS 允许 `w`（transfinity，内部存 -1）。

第二批三个记号的形态不同（VB.NET 批次）：

| 程序 | 记号名 | 形态 | 例 |
|---|---|---|---|
| kp_hydra | Simplified Primitive Sequence | 括号串，嵌套深度 = 元素值 | `((()))` = 1,2,3 |
| lprss | Long Primitive Sequence System | 逗号分隔整数 | `1,2,3` |
| pss_hydra | Simplified Pair Sequence | `数(` 嵌套串 | `0(1(2()))` |

## 反编译产物 ↔ 复原源码

| 反编译文件 | 复原文件 | 记号名（exe 自报） | 形态 |
|---|---|---|---|
| 0-Y.exe.c | notations/zero_y.cpp | 0-Y Sequence | 序列 |
| 0-Y Super Non-Lifting.exe.c | notations/zero_y_super_non_lifting.cpp | Ultimately Idealized 0-Y Sequence | 序列 |
| Simplified -2-Y.exe.c | notations/simplified_minus2y.cpp | Simplified -2-Y Sequence | 序列 |
| BM4.1.exe.c | notations/bm41.cpp | Bashicu Matrix 4.1 | 矩阵 |
| Bashicu Matrix.exe.c | notations/bashicu_matrix.cpp | Bashicu Matrix | 矩阵 |
| BMS Row-Extend Non-Ceiling.exe.c | notations/bms_row_extend.cpp | Limited Row-Extending BMS (non-Ceiling-upgrade) | 矩阵（行内变长） |
| BMS Stronf.exe.c | notations/bms_stronf.cpp | Stronf Bashicu Matrix | 矩阵 |
| BMS Upgradissimo.exe.c | notations/bms_upgradissimo.cpp | Upgradissimo Bashicu Matrix | 矩阵 |
| Parented BMS.exe.c | notations/parented_bms.cpp | Parented Bashicu Matrix | 矩阵 |
| Parented Predecessor Matrix.exe.c | notations/ppm.cpp | Parented Predecessor Matrix 2 | 矩阵 |
| Parented Predecessor Matrix 3.exe.c | notations/ppm3.cpp | Parented Predecessor Matrix 2（exe 原文如此） | 矩阵 |
| Parented Predecessor Matrix 00T.exe.c | notations/ppm00t.cpp | Parented Predecessor Matrix 00T | 矩阵 |
| LELS (Base-omega Array).exe.c | notations/lels.cpp | Linear Eternally Lifting Sequence | 矩阵 |
| Multiple Father Sequence System.exe.c | notations/mfss.cpp | Multiple Father Sequence System (2 fathers) | 序列 |
| Parented Predecessor Sequence.exe.c | notations/pps2.cpp | Parented Predecessor Sequence 2 | 序列 |
| Parented Predecessor Sequence 3.exe.c | notations/pps3.cpp | Parented Predecessor Sequence 3 | 序列 |
| Parented Predecessor Sequence 4.exe.c | notations/pps4.cpp | Parented Predecessor Sequence 4 | 序列 |
| Parented Predecessor Sequence 4 weak.exe.c | notations/pps4_weak.cpp | weak Parented Predecessor Sequence 4 | 序列 |
| Parented Predecessor Sequence 4 second.exe.c | notations/pps4_second.cpp | second extremely weak … 4 | 序列 |
| Parented Predecessor Sequence 4 third.exe.c | notations/pps4_third.cpp | third weak … 4 | 序列 |
| Parented Predecessor Sequence 4 extremely weak.exe.c | notations/pps4_extremely_weak.cpp | extremely weak … 4 | 序列 |
| Parented PrSS.exe.c | notations/prss_parented.cpp | Parented Primitive Sequence System | 序列 |
| Coprime Sequence.exe.c | notations/coprime.cpp | Coprime Series sequence | 序列 |
| HIUN.exe.c | notations/hiun.cpp | Hierarchial Increase Unit Notation | 序列 |
| Remainder Retention Sequence System.exe.c | notations/remainder_retention.cpp | Remainder Retention Sequence System | 序列（1 起址、空格分隔） |
| Residue Class Sequence.exe.c | notations/residue_class.cpp | Residue Class Sequence | 序列 |
| STOS.exe.c | notations/stos.cpp | Single Transfinity Ordinal Sequence | 序列（含 `w`） |
| KP Hydra.cs | notations/kp_hydra.cpp | Simplified Primitive Sequence | 括号串 |
| LPrSS.cs | notations/lprss.cpp | Long Primitive Sequence System | 序列 |
| PSS Hydra.cs | notations/pss_hydra.cpp | Simplified Pair Sequence | 嵌套串 |

## 复原时保留的「原味」

为了能和反编译代码一行行对照，以下细节**故意没有"修好"**：

* `x / y / l / pm[] / s0[] / ac[][]` 仍是全局量，充当函数间的隐式参数。
* `txar()` 用 `(int)log10(v*100+1)` 当步进（数字位数 + 1 个分隔符）——这是原程序
  的写法；遇到 0 会退化成步进 0，见下面"审计过程中据此修正了 5 处复原错误"。
* `limit()` 里的 off-by-one（原程序写成 `while(!(n<i))` 会多吐一个元素）原样保留。
* 原程序 `txar()` 返回栈上局部数组（悬垂指针），复原版改成静态缓冲：行为等价但无 UB。
* `precursor()` 里 `if (x == 1)` 用的是上一次遗留的全局 `x`，照抄。

已知差异 / 限制：

* 和原始 exe 一样**不做输入校验**：给序列程序喂矩阵串（或反之）照样会崩，未加防护。
* 没有原始 exe 可跑，无法做逐字节比对；当前验证方式是结构对照 + 下面的自洽性测试。

## TypeScript 版

同级目录 `../onp2-ts/` 是这批记号的 TypeScript 移植，接口对齐序数界面网页版
（ordinal-interface）的 `ONP2Plugin`，可直接当插件加载。它以本目录的 C++ 可执行
为基准做逐条对拍验证，30/30 全部一致。详见 `../onp2-ts/README.md`。

## 验证

**第一批（27 个 C++）**：`test.py` 对每个程序跑 5 项不变量（各 4 组输入），27/27 全部通过：

* P1 `precursor(X)` == X 去掉末元素
* P2 `compare(X, X)` == 1
* P3 `expand(0, X)` == `precursor(X)`
* P4 `expand(1, X)` 正常输出
* P5 `type0(X)` ∈ {1,2,3}

**第二批（3 个 VB.NET）**：`tools/ref_vb.py` 先把 3 份 `.cs` 按 VB 的 1-based
`Strings.Mid` 语义原样直译一遍，`tools/check_vb.py` 再拿 C++ 移植版与它逐条对拍
（limit / type0 / precursor / expand×4 / compare×16，共 128 条），**全部一致**。
C# 复原版与 C++ 移植版是同一套逻辑的两种写法。`tools/scan_features.py` 是审计时
用来批量抽取 27 份 C++ 反编译产物里 `txar` / `arout` / `limit` 特征的小工具。

审计过程中据此修正了 10 处复原错误（6、7 由源 exe 实测确认，8~10 由 LELS 原始源码比对确认）：

1. `coprime.cpp` 父链上溯的循环条件写反了（应为"存在 >1 公因子就继续上溯"），
   原写法在任何输入下都会死循环。
2. `stos.cpp` 的解析器没处理 `w`（应记作 -1）、输出的 `w` 后缺逗号、比较前漏了
   `[x, x-1, -1]` 片段的消去步骤。
3. `remainder_retention.cpp` 是全组唯一的 1 起址 + 空格分隔记号，原先误用了 0 起址
   逗号分隔的通用框架。
4. `common.h` 的 `txar()` 遇到元素值 0 时步进算出 0（原程序就是
   `i += (int)log10(v*100+1)`），会死循环并把后续元素冲成 0 —— 原 exe 里还会写越界。
   按"数字位数 + 1 个分隔符"的本来语义改为 `v == 0` 时步进 2。
   只在"0 后面还跟着非零数字"时暴露，例如矩阵行 `(0,1)`。
5. Bashicu 系 5 个记号的 `delta[]` 忘了清零（原 exe 显式清了），
   展开结果里混进过未初始化内存的垃圾值。
6. **5 个记号的「最大序数的基本列」**：原先按反编译产物复原成"忽略参数、恒给 `1`"，
   源 exe 实测是**第 a 项 = `1,a+1`**（`(0) 1,1  (1) 1,2  (2) 1,3`）。
   涉及 `zero_y` / `zero_y_super_non_lifting` / `coprime` /
   `simplified_minus2y` / `residue_class`；`remainder_retention` 同改
   （空格分隔，`1 a+1`）。
7. **`remainder_retention` 的展开**：复制段起点与父指针平移量算错，
   源 exe 实测 `"1 2"` 的基本列是 `1 / 1 1 / 1 1 1 / 1 1 1 1`，
   原先从 n=1 起就恒为 `1 1`。
8. **LELS `Ex()`：扫描用的 `k` 与填充用的 `au` 被合成了一个变量**。
   原程序是 `int al=-1,au=-1,lf=0,j2=-1,k=-1;` —— `k` 在扫描里定、`au` 在填充里从 -1
   开始更新，两者不同。合二为一后填充段第一轮的 `j<au` 判断沿用了扫描得到的 `k`，
   `(0,0)(1,1)(2,1)` 展开错成 `(0,0)(1,1)(1,1)(0,1)`。
9. **LELS `Ex()`：扫描循环扫到底时把 `lf` 清零了**。原程序是 `for(j=y-1;j>=0;j--)`，
   扫到底自然结束、`lf` 保留最后一次算出的值；清零后本该走「抬升」分支的被降级成
   简单复制，`(0,0)(1,1)(2,0)` 展开错成 `(0,0)(1,1)(1,0)(1,1)`。
   （对应的另一处 `if(k<=k3&&k>-1){lf=0;break;}` 原程序**确实**清零，已保留。）
10. **LELS `compare0()` 的比较宽度** —— 见下节，这是**有意偏离** exe 的修复。

## LELS 的 compare 不反对称（已按作者要求修掉）

原程序 `compare0()` 里，`y`（比较宽度）只由**第二个参数 sb** 决定
（`compa()` 读全局 `y`，而 `y` 由 `txma(sb)` 设定），于是 **sa 比 sb 多出来的列被忽略**：

```
compare0("(0,0,0)(0,0,1)", "(0)(1)")  -> "2"（判 a<b）
compare0("(0)(1)", "(0,0,0)(0,0,1)")  -> "2"（也判 a<b）
```

两个方向都判"小于"。但前者是 `fsLimit(3)`、后者是 `fsLimit(1)`，前者显然更大。
LELS 原始源码（`LELS.cpp`）与反编译产物都印证了这点，是原程序行为。

作者确认"原 exe 是这个行为，但是还是要修了"，故改成**比较宽度取两侧列数的较大值**
（多出来的列按 0 参与比较）：

```c
// 原实现为：y = colsB;
y = max2(colsA, colsB);
```

改动只影响两侧列数不同的情形；列数相同时与原程序完全一致（已用原始源码对拍验证：
375 条命令里，列数相同的 compare **0 条**变化）。

连带修好的：原程序第二次 `txma` 前只清 `x`、**没清 `y`**，所以 sb 只有 1 行时
`y` 沿用 sa 的列数 —— 取 max 后这一点自动成立（`colsB` 为 0 时 max 即 `colsA`）。

## 第二批里如实保留的两处「原味」

* **KP Hydra 与 PSS Hydra 的 `precursor` 与 `expand(0)` 并不一致**。
  两者的 `precursor` 都是「砍掉末尾 k 个字符」（KP 砍 2 个、PSS 砍 3 个），
  对 `limit()` 产出的嵌套串会切出不闭合的结果；而 `expand(0, X)` 走的是
  「父副本替换」那条路径，给出的才是真正的前驱。例如：

  ```
  KP   X = "((()))"   precursor -> "((()"     expand(0) -> "(())"
  PSS  X = "0(1(2()))" precursor -> "0(1(2()"  expand(0) -> "0(1())"
  ```

  没有替它们「修好」——这是原程序的行为，改了就不再是对着反编译产物复原了。

* **`LPrSS` 展开单元素序列（如 `1`）时原程序会越界**。它向左找「第一个小于末
  元素的位置」，单元素序列找不到，`b[i]` 下标会变成 -1（VB 抛
  `IndexOutOfRangeException`）。C++ 版在此处返回原序列兜底，并用注释标明。


---

## 附：PPS4 替换 与 txar 步进修正

2026-11-07 曾新增 `notations/pps4_v2.cpp`（另一版 exe.c），在 `common.h` 的
`DecMode` 里加了 `DEC_SCAN_LE_WIDE`：降级扫描下界从 `a[p]-1` 放宽到 0、
回退判断移到循环外；与旧版 `pps4` 相比命令 1/2/3/5 逐字相同、
546 条命令里 53 条差异全在命令 4。

**2026-11-08 已替换**：与用户 exe 不符的旧 `pps4` 删除，`pps4_v2.cpp`
改名为 `pps4.cpp` 并成为唯一版本；旧的 `DEC_SCAN_LE` 枚举与分支从
`common.h` 移除（数值 1 留空号）。当前实现说明见 [`../../pps4-v2.md`](../../pps4-v2.md)，
历史归档见 [`../../pps4-v2-changes/README.md`](../../pps4-v2-changes/README.md)。

同一轮把 `common.h` 的 `txar()` 步进改成原程序 `flzero()` 揭示的
`(v + (v==0)) * 100 + 1`（此前误用 `(v+bias) * 100 + 1`，bias=1 时
`v=9/99/999` 会多跳一位）。C++ 与 TS 两侧同步。

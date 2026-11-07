# PPS4 另一版本（2026-11-07）的临时材料

这一轮解析新版 `Parented Predecessor Sequence 4.exe.c`、写出 `pps4_v2` 时
产生的中间文件。**原本都在 `/tmp`**，本轮整理时检查发现 `/tmp` 又被环境清空，
所以按对话记录重建了脚本与输出。

| 文件 | 是什么 |
|---|---|
| `pps4_v2_functions_excerpt.c` | 从新版 exe.c 第 1369–1740 行抽出的函数区（`flzero` → `Ex`），是解析时实际读的那一段。性质与 `01_decompiled_slices/core/` 的切片相同，**逐字原文节选，未改动** |
| `scripts/ex_slice_diff.py` → `ex_slice_diff.txt` | 把两版 exe.c 按函数切开逐个比对的脚本与原始输出。结论：只有 `Ex()` 实质不同；`txar` 的"不同"只是 Ghidra 对 `std::log10<int>` 的 demangled/mangled 显示差异 |
| `scripts/compare_pps4_versions.py` → `behavior_diff.txt` | 新旧两版复原版跑 546 条命令的对拍脚本与输出：53 条差异全在命令 4 |
| `scripts/txar_step_audit.py` → `txar_step_audit.txt` | 枚举 0..1999 找出 txar 步进公式的分叉值 `[9, 99, 999]`，以及 10 个受影响的 bias=1 记号 |

三个脚本同时收进了仓库的 `docs/pps4-v2-changes/scripts/`
（那边是正式归档，带用法说明）；这里保留一份是因为它们本来就是工作区里的
临时文件，符合本包的收录范围。

## 没有重建的

- `/tmp/pps4cmp.py` —— `compare_pps4_versions.py` 的前身，内容一致。
- `/tmp/lels_orig_dbg.cpp` 等 LELS 插桩文件 —— 上一轮的，见 `04_diagnostics_rebuilt/README.md`
  里"没有重建的"清单。
- `/tmp/v3.mjs`、`/tmp/v4.mjs`、`/tmp/cn3.mjs`、`/tmp/cn4.mjs`、`/tmp/i1.mjs`、
  `/tmp/o_verify.mjs` 等 —— esbuild 打包出来的一次性验证产物，属编译产物，排除。
- `/tmp/testpy3.log`、`/tmp/exdiff.txt` —— 日志与中间输出；内容已分别收进
  `behavior_diff.txt` / `ex_slice_diff.txt`。

## 一个前提

旧版 `Parented Predecessor Sequence 4.exe.c` 已被 11/7 的新版**覆盖**，
本包 `01_decompiled_slices/core/Parented Predecessor Sequence 4.core.c`
是当时逐字抽出的函数切片，也是现在唯一的旧版基准。
`ex_slice_diff.py` 依赖它，跑之前别删。

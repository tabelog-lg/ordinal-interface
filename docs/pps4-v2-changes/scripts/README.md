# 诊断脚本

这轮（PPS4 另一版本）用的 3 个脚本。**原本写在 `/tmp`**，本轮整理时 `/tmp` 已被
环境清空，按对话记录重建，内容一致，补了用法注释。它们是一次性诊断工具，
不属于任何工程，删掉不影响构建。

| 脚本 | 用途 | 依赖 |
|---|---|---|
| `compare_pps4_versions.py` | 新旧两版复原版跑 546 条命令（命令 1~5 全覆盖），输出按命令分类的差异清单 → `02-behavior-diff.txt` | `ONP2/bin/pps4`、`ONP2/bin/pps4_v2`（`cd ONP2 && make`） |
| `ex_slice_diff.py` | 把两版反编译产物按函数切开，逐个比对，打印 `Ex()` 的 unified diff → 结果写进 `01-reversed-diff.md` | 新版 `/data/inputs/Parented Predecessor Sequence 4.exe.c`；旧版 `core/Parented Predecessor Sequence 4.core.c` |
| `txar_step_audit.py` | 枚举 0..1999，找出「原程序 flzero 步进」与「旧复原版 (v+bias) 步进」的分叉值 → 结果写进 `03-txar-fix.md` | 无（纯 Python） |

## 读输出时注意两点

1. `ex_slice_diff.py` 会把 `txar(char*)` 报成"不同"，但那只是 Ghidra 对同一个
   `std::log10<int>` 模板实例的显示方式差异（demangled 名 vs mangled
   `_text__ZSt...`），逻辑完全一致。
2. `Ex()` 的 diff 末尾会多出一段 `void __tcf_0(void) {...}`，那是按
   「下一个 `// ` 注释」切函数体时的边界噪音（CRT 静态析构注册），不是记号逻辑。

## 输出证据

- `../02-behavior-diff.txt` — 546 条命令的完整差异输出
- 临时文件包 `05_pps4_v2/` 里另有 `ex_slice_diff.txt`、`txar_step_audit.txt`
  与新版 exe.c 的函数区摘录 `pps4_v2_functions_excerpt.c`

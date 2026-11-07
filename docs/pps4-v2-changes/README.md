# PPS4 另一版本 —— 本轮变更归档

2026-11-07 又给了一份 `Parented Predecessor Sequence 4.exe.c`（94,425 B，
覆盖了 11/1 那份）。这个文件夹把**这一次改动的全部内容**单独收在一起：
反编译对照、实测差异、新增/修改的文件副本、诊断脚本、验证结果。

上一轮写的 `docs/pps4-v2.md` 是简要版，这里是不依赖其它文件的完整展开版。

---

## 一句话结论

它是**同一记号的另一份实现**，不是已有的 weak / second / third / extremely weak
变体。整套反编译产物里**只有 `Ex()` 的一处循环边界变了**：末元素降级扫描的
下界从 `a[p]-1` 放宽到 0，且"没命中就回退父值"从循环体内移到循环外。
命令 1/2/3/5 逐字相同，546 条命令里 **53 条差异全部落在命令 4（展开）**。

新版把末元素降级得更狠，展开结果整体偏短：

| 命令 4 | 旧版 | 新版 |
|---|---|---|
| `1 · 0,1,2` | `0,1,2` | `0,1,1` |
| `2 · 0,1,2` | `0,1,2,2` | `0,1,1,1` |
| `1 · 0,1,2,3,4,5` | `0,1,2,3,4,5` | `0,1,2,3,4,4` |
| `1 · 0,1,0` | `0,1,0,3,4` | `0,1` |

---

## 文件夹内容

| 文件 | 内容 |
|---|---|
| **`README.md`** | 本文件：总说明、验证结果、怎么用 |
| **`01-reversed-diff.md`** | 两版 exe.c 逐函数对照表、`Ex()` 的精确 unified diff、`a[a[x-1]-2] == a[p]` 的推导、与四个已有变体的关系 |
| **`02-behavior-diff.txt`** | 546 条命令对拍的原始输出，含全部 53 条差异 |
| **`03-txar-fix.md`** | 解析时顺带发现的 `txar()` 步进偏差：`flzero()` 揭示原程序用 `(v+(v==0))*100+1`，框架误用 `(v+bias)*100+1` |
| **`04-file-manifest.md`** | 9 个新增 / 6 个修改的逐文件清单，含正式路径与所在 zip |
| **`changed-files/`** | 这次新增/修改的文件副本（见 `04-file-manifest.md`） |
| **`scripts/`** | 3 个诊断脚本 + 说明：`compare_pps4_versions.py`、`ex_slice_diff.py`、`txar_step_audit.py` |

`changed-files/` 是**副本**，正式文件在各工程目录里，都在已交付过的
`ordinal-interface-integration.zip` / `onp2-ts.zip` / `ONP2.zip` 中。

---

## 改动了什么

**新增记号** `pps4_v2`：

- `src/notations/pps4_v2.ts` + `plugins/pps4_v2.plugin.js`（TS 版，可直接加载）
- `ONP2/notations/pps4_v2.cpp`（C++ 对拍基准）
- `BUILTINS` 与 `NOTATION_NAMES` 各加一条，注册表 30 → 31

**共通框架**：`DecMode` 加 `DEC_SCAN_LE_WIDE`，`ppsEx()` 加一个分支
（下界 0、回退移循环外）。C++ `common.h` 与 TS `core/seq.ts` 同步。

**顺带修正的框架偏差**：`txar()` 步进改回原程序 `flzero()` 揭示的公式，
影响 10 个 bias=1 记号在元素值为 9/99/999 时的解析。详见 `03-txar-fix.md`。

**命名**：exe 的 `name0()` 打印无后缀的 `Parented Predecessor Sequence 4`，
TS 里写成 `... (v2)` 避免列表同名；C++ 复原版保持 exe 原样。

---

## 验证结果

| 检查 | 结果 |
|---|---|
| 两版复原版对拍（546 条命令） | 命令 1/2/3/5 零差异；命令 4 有 53 条差异（预期） |
| TS vs C++ 全量对拍 | 5059 条，0 不一致 |
| 插件校验 | 31 个，1635 条，0 失败 |
| `tsc --noEmit`（两个工程） | 零错误 |
| `npm run verify`（仓库） | 全部通过 ✅ |
| `check-names` | 31 个名字，0 不一致 |
| C++ 自洽性 | 27/27 通过 |
| 宿主集成实验 | 31 个记号初始化 0 失败；`pps4_v2` rootType=3、`firstExceeding` index=1 |

远端 GitHub 仓库**没有改动**，以上都在本地副本。

---

## 复现

```bash
# 1. 两版 exe.c 逐函数比对
python3 scripts/ex_slice_diff.py

# 2. 两版行为差异（需先 cd ONP2 && make）
python3 scripts/compare_pps4_versions.py > 02-behavior-diff.txt

# 3. txar 步进分叉审计
python3 scripts/txar_step_audit.py
```

`ex_slice_diff.py` 依赖 `/data/inputs/Parented Predecessor Sequence 4.exe.c`
（新版）与 `/data/workspace/core/Parented Predecessor Sequence 4.core.c`
（旧版切片，在 `ordinal-interface-temp-files.zip` 的
`01_decompiled_slices/core/` 里）。原始 exe.c 已被新版覆盖，旧版只剩这份切片。

# 过程性资料总索引

> 本目录收录项目进行期间产生的**说明性文档**，以及三个「工作区临时文件包」的
> 内容清单。它们回答的是「复原时依据了哪些中间材料、哪些东西已经不在了」，
> 与 [`../README.md`](../README.md) 里的正式文档互补。
>
> **这里只有说明，没有过程产物本体**：反编译切片、远端仓库快照、tarball 缓存、
> 编译产物都不进工程仓库（体积大、可重新取得、不参与构建）。清单见下文。
> **本目录不参与构建。**

---

## 一、三个来源包

三个文件扩展名是 `.txt`，**实际是 ZIP**（`PK\x03\x04`）。它们是上一轮整理工作区时
打包的，本轮按内容解压并归置。

| 包 | 条目数 | 性质 | 本仓库收录了什么 |
|---|---|---|---|
| `ordinal-interface-temp-files.txt` | 383 | 反编译切片 + 废弃草稿 + 漏删探针 + 重建的诊断脚本 + PPS4 v2 临时材料 | 4 份说明文档中的 3 份（下方 ①②③） |
| `pps4-v2-changes.txt` | 22 | **PPS4 两版对照的历史归档**（11/7 快照） | 全量落在 [`../pps4-v2-changes/`](../pps4-v2-changes/README.md)，另加 [`STATUS.md`](../pps4-v2-changes/STATUS.md) 说明 11/8 替换后的状态 |
| `workspace-extras.txt` | 322 | 交付物副本 + 下载缓存 + 远端仓库快照 | 说明文档 ④ |

### 本目录的 4 份原件

| 文件 | 原包内位置 | 内容 |
|---|---|---|
| [`temp-files.md`](./temp-files.md) | `temp/README.md` | 383 个条目的逐项说明：27 个 `.core.c`、338 个按函数切片、废弃草稿、`lels_probe.mjs`、`04_diagnostics_rebuilt/`、`05_pps4_v2/`；以及「明确没有收录的」清单 |
| [`diagnostics-rebuilt.md`](./diagnostics-rebuilt.md) | `temp/04_diagnostics_rebuilt/README.md` | 6 个重建诊断脚本的用途与跑法、`lels_orig_patched.cpp` 的两个坑（必须 `-O0`、`cc` 未初始化）、以及「没有重建的」清单 |
| [`pps4-v2-temp.md`](./pps4-v2-temp.md) | `temp/05_pps4_v2/README.md` | PPS4 v2 那轮的中间文件：新版 exe.c 函数区摘录、两版逐函数 diff、546 条命令对拍、txar 步进审计 |
| [`workspace-extras.md`](./workspace-extras.md) | `extras/README.md` | 交付物副本、两个 tarball 缓存、两份远端快照（`ghrepo` / `ghrepo2`）的差异，以及已删除且无法恢复的临时文件清单 |

> 这 4 份是**原包内视角**写的，文中路径指向原 ZIP 的目录结构，不是本仓库路径。
> 本文件是它们的导航层。

---

## 二、未纳入本仓库的过程产物，以及去哪找

| 类别 | 原包内路径 | 数量 / 体积 | 为什么不收 |
|---|---|---|---|
| Ghidra 反编译核心切片 | `temp/01_decompiled_slices/core/` | 27 个 `*.core.c` | 从用户提供的 `*.exe.c` 逐字节选，**不是可编译源码**；用户手上已有原始输入 |
| 按函数切开的反编译产物 | `temp/01_decompiled_slices/fns/` | 338 个 `.c`，27 个子目录 | 同上，逐字原文节选，用于同名函数 diff |
| 新版 PPS4 函数区摘录 | `temp/05_pps4_v2/pps4_v2_functions_excerpt.c` | 1 个 | exe.c 原文节选；两版差异的权威结论已写进 [`../pps4-v2-changes/01-reversed-diff.md`](../pps4-v2-changes/01-reversed-diff.md) |
| 诊断脚本与原始输出 | `temp/04_diagnostics_rebuilt/`、`temp/05_pps4_v2/` | 6 + 3 个脚本、若干 `.txt` | 3 个 PPS4 脚本已收进 [`../pps4-v2-changes/scripts/`](../pps4-v2-changes/scripts/README.md)；两份原始输出（`ex_slice_diff` / `txar_step_audit`）补在同目录 `diagnostics-*.txt`；LELS 诊断脚本是一次性工具，删掉不影响构建 |
| 废弃草稿 / 漏删探针 | `temp/02_abandoned_draft/`、`temp/03_stray_probes/` | 2 个 | 纯残留，`lels_probe.mjs` 的 import 路径还是错的，跑不通 |
| 交付物副本 | `extras/deliverables/` | 5 个（含 2 个 zip） | 前几轮已交付，纯备份 |
| 远端仓库下载缓存 | `extras/download-cache/` | `repo.tgz` / `r2.tgz` | 对应 `05293d8` / `bd2a297` 两个 commit，git 历史可重新取得 |
| 远端工作副本快照 | `extras/snapshots/ghrepo*` | 2 份完整源码树 | 已排除 `node_modules` / `dist`；`ghrepo2` 就是远端仓库当时的样子，无独占价值 |

**旧版 PPS4 基准的唯一留存**：`11/1` 那份 `Parented Predecessor Sequence 4.exe.c`
已被 11/7 新版覆盖，`temp/01_decompiled_slices/core/Parented Predecessor Sequence 4.core.c`
是当时逐字抽出的函数切片，也是现在唯一的旧版基准。
[`../pps4-v2-changes/scripts/ex_slice_diff.py`](../pps4-v2-changes/scripts/ex_slice_diff.py)
依赖它，跑之前别删。

### 已删除、现在找不回来的

`/tmp` 在沙盒重建时被清空，以下只剩文字记录（详见
[`workspace-extras.md`](./workspace-extras.md) 第三节与
[`diagnostics-rebuilt.md`](./diagnostics-rebuilt.md) 的「没有重建的」）：

- 浏览器无头截图、裁剪图（`shot-*.png` / `crop-*.png` / `view-*.png`）
- 性能基准原始数据 `bench-before.txt` / `bench-after*.txt`——**结论已进根 README 的性能对比表**，
  但「优化前」数值只能从表里反推，无法精确复原
- 各类一次性探针、esbuild 打包冒烟脚本、API 响应缓存与日志
- LELS 插桩调试版与备份（`/tmp/lels_orig_dbg.cpp` 等）

---

## 三、反编译切片覆盖的 27 个记号

`core/` 与 `fns/` 的 27 个子目录一一对应，命名即 exe 的 `name0()` 输出：

```
0-Y                              0-Y Super Non-Lifting
BM4.1                            BMS Row-Extend Non-Ceiling
BMS Stronf                       BMS Upgradissimo
Bashicu Matrix                   Coprime Sequence
HIUN                             LELS (Base-omega Array)
Multiple Father Sequence System  Parented BMS
Parented PrSS                    Parented Predecessor Matrix 00T
Parented Predecessor Matrix 3    Parented Predecessor Matrix
Parented Predecessor Sequence 3  Parented Predecessor Sequence 4 extremely weak
Parented Predecessor Sequence 4 second
Parented Predecessor Sequence 4 third
Parented Predecessor Sequence 4 weak
Parented Predecessor Sequence 4  Parented Predecessor Sequence
Remainder Retention Sequence System
Residue Class Sequence           STOS
Simplified -2-Y
```

每个目录按序号切出 `arout` / `txar` / `txma` / `maout` / `limit` / `type0` /
`precursor` / `expand` / `compare0` / `par` / `asmt` / `Ex` 等函数。
当时用它们得出的结论是：**27 个记号共用同一份骨架**，Bashicu 系五六个记号的
`expand` 只差几行。这是 [`../ONP2-protocol-and-restoration.md`](../ONP2-protocol-and-restoration.md)
与 `src/notations/core/` 共通框架的由来。

> 注意：这 27 个是**第一批 C++ 记号**；网页版 30 个记号里另有 3 个来自
> VB / C# 复原（KP Hydra、LPrSS、PSS Hydra）。11/7 曾短暂多出 `pps4_v2`，
> 2026-11-08 已把它提升为唯一的 `pps4` 并删除旧版，故不再是第 31 个。

---

## 四、与其他文档的关系

| 想找 | 去哪 |
|---|---|
| 实现基准、本轮改了什么 / 没改什么 | [`../IMPLEMENTATION-NOTES.md`](../IMPLEMENTATION-NOTES.md) |
| 11 份实现审查报告与基准原文 | [`../reviews/README.md`](../reviews/README.md) |
| PPS4 两版对照与替换的历史归档 | [`../pps4-v2-changes/README.md`](../pps4-v2-changes/README.md) |
| PPS4 当前实现基准（原 v2） | [`../pps4-v2.md`](../pps4-v2.md) |
| 可编译的 C++ / C# / VB 复原源码 | [`../restored/README.md`](../restored/README.md) |
| 26 个 exe 的对拍工具与报告判读 | [`../crosscheck.md`](../crosscheck.md)、[`../../tools/README.md`](../../tools/README.md) |
| 全部文档的总导航 | [`../README.md`](../README.md) |

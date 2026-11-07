# 状态提示（2026-11-08）

> 本文件是**后加的导航层说明**；本目录其余文件是 2026-11-07 那轮修正的
> 历史快照，逐字保留、未改写。

## 当前状态

用户确认 11/1 那份 `pps4` 复原版有问题（与用户提供的 exe 在命令 4 上不符），
已于 **2026-11-08 删除**；本归档所述的 11/7 实现从 `pps4_v2`
**提升为唯一的 `pps4`**。现在：

| 本归档（11/7 快照）的写法 | 当前状态 |
|---|---|
| 新增记号 `pps4_v2`，注册表 30 → 31 | 只有 `pps4` 一个主记号，注册表 31 → **30** |
| `src/notations/pps4_v2.ts` | 已删除；`src/notations/pps4.ts` 装入该实现 |
| `docs/restored/cpp/notations/pps4_v2.cpp` | 已删除；`notations/pps4.cpp` 装入该实现 |
| TS `name = 'Parented Predecessor Sequence 4 (v2)'` | `name = 'Parented Predecessor Sequence 4'`（无后缀） |
| `DecMode` 加 `DEC_SCAN_LE_WIDE: 4`，与 `DEC_SCAN_LE` 并存 | `DEC_SCAN_LE` 已删（数值 1 留空号），`DEC_SCAN_LE_WIDE` 是 PPS4 唯一模式 |
| `txar` 修正影响 10 个 bias=1 记号 | 9 个（`pps4_v2` 并入 `pps4`） |
| 命令 5 / 注册表 / 内置总数 33 | 内置总数 **32**（2 + 30） |
| `changed-files/repo/src/notations/pps4_v2.ts` 等副本 | 仅为当时的文件副本，不是当前路径 |

## 技术结论仍然成立

本归档里的**两版 `Ex()` 逐函数对照、546 条命令对拍的 53 条差异、以及
`txar()` 步进公式的推导**依然有效——它们记录的是「为什么旧版不对」，
正是这次删除旧版的依据。当前实现说明见
[`../pps4-v2.md`](../pps4-v2.md)，替换清单见
[`../CHANGELOG.md`](../CHANGELOG.md) 的「2026-11-08（第一轮）」一节。

## 复现脚本的路径前提

[`scripts/ex_slice_diff.py`](./scripts/README.md) 依赖工作区临时包里的旧版函数切片
`01_decompiled_slices/core/Parented Predecessor Sequence 4.core.c`，
以及 11/7 新版 `Parented Predecessor Sequence 4.exe.c`。两者都**不在本仓库**
（清单见 [`../process-artifacts/README.md`](../process-artifacts/README.md)），
跑之前需要按该文档把临时包放回工作区。

> 目录名与 `01`~`04` 的标题保留「v2 / 另一版本」等字样，是为了与
> 11/7 的原始交付一致；请按本文件理解其时效性，不要按归档里的路径去找代码。

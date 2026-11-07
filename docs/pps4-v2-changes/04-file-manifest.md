# 变更文件清单

本轮共 **9 个新增**、**6 个修改**。`changed-files/` 目录里是它们的副本，按工程分了三个子目录，方便直接看内容：

```
changed-files/
├── repo/        网页版仓库副本（src/、docs/pps4-v2.md）
├── onp2-ts/     TS 工程（源码、插件、两个测试脚本）
└── cpp/         C++ 复原版（common.h、pps4_v2.cpp）
```

正式位置列在下面，且都在已交付过的 zip 里。

| 交付 zip | 覆盖内容 |
|---|---|
| `ordinal-interface-integration.zip` | 网页版仓库副本（含本文件夹本身、`docs/restored/cpp/`） |
| `onp2-ts.zip` | TS 工程 + 31 个自包含插件 |
| `ONP2.zip` | C++ 复原版（31 个可执行源码 + `common.h`） |

## 新增（9）

| 文件 | 正式位置 | 内容 |
|---|---|---|
| `pps4_v2.ts` | `src/notations/pps4_v2.ts` | 新版 PPS4 的 TS 实现，继承 `SeqNotation`、`bias=1`，用新的 `DEC_SCAN_LE_WIDE` 降级模式 |
| `pps4_v2.plugin.js` | `plugins/pps4_v2.plugin.js`（onp2-ts 工程） | 自包含 ES module，可直接加载到网页版 |
| `pps4_v2.cpp` | `ONP2/notations/pps4_v2.cpp` | C++ 复原版基准，`name0()` 保持 exe 原样（无后缀） |
| `pps4-v2.md` | `docs/pps4-v2.md` | 上一轮写的简要对照（本文件夹是它的完整展开版） |
| `pps4-v2-changes/` | `docs/pps4-v2-changes/` | **本文件夹**：完整变更归档 |
| `README.md` | 本文件夹 | 总说明 |
| `01-reversed-diff.md` | 本文件夹 | 两版 exe.c 逐函数对照 |
| `02-behavior-diff.txt` | 本文件夹 | 546 条命令对拍的 53 条差异 |
| `03-txar-fix.md` | 本文件夹 | txar 步进修正推导 |

## 修改（6）

| 文件 | 正式位置 | 改了什么 |
|---|---|---|
| `seq.ts` | `src/notations/core/seq.ts`（仓库）/ `src/core/seq.ts`（onp2-ts） | ① `DecMode` 加 `DEC_SCAN_LE_WIDE: 4`；② `ppsEx()` 加宽扫描分支（下界 0、回退移循环外）；③ `txar()` 步进改为 `(v + (v===0)) * 100 + 1` |
| `common.h` | `ONP2/common.h` | 同上，C++ 侧：`DEC_SCAN_LE_WIDE` 枚举 + `ppsEx()` 分支 + `txar()` 步进 |
| `index.ts` | `src/notations/index.ts`（仓库）/ `src/index.ts`（onp2-ts） | 注册表 30 → 31，加 `pps4V2` 的 import 与 `pps4_v2` 项 |
| `plugins.ts` | `src/engine/plugins.ts` | `NOTATION_NAMES` 加 `pps4_v2`；`BUILTINS` 加一条懒加载定义 |
| `diff.cjs` | `onp2-ts/tests/diff.cjs` | SPEC 加 `pps4_v2`；SEQ 语料加 `'9,1'`、`'9,1,2'`、`'0,9,1'` 回归用例 |
| `verify-plugins.mjs` | `onp2-ts/tests/verify-plugins.mjs` | SEQ 语料加同样 3 个回归用例 |

## 文档连带更新（计数与索引）

`README.md`（仓库）、`README_EN.md`、`INTEGRATION.md`、`index.html`、
`onp2-ts/README.md`、`ONP2/README.md`、`docs/restored/README.md`、
`docs/restored/cpp/README.md`：把「30 个记号 / 32 个内置」改成
「31 个 / 33 个内置」，加 `pps4-v2.md` 索引与 txar 修正说明。

## 命名约定

exe 里 `name0()` 打印的仍是 `Parented Predecessor Sequence 4`，与旧版同名
（和 PPM3 撞 PPM 名是同一类情况）。TS 版 `name` 写成
`Parented Predecessor Sequence 4 (v2)`、id 用 `pps4_v2`，便于在记号列表里区分；
C++ 复原版的 `name0()` 保持无后缀，因为它是对拍基准。

若想让新版**替换**旧的 pps4：删掉 `plugins.ts` 里 `pps4` 那条 BUILTINS、
把 `pps4_v2` 的 id 改回 `pps4`，并同步 `NOTATION_NAMES` 与 `check_names.mjs`
的名字断言即可。

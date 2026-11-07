# 项目过程中的临时文件

做这个项目时在工作区里留下的**非工程文件**（含 2026-11-07 PPS4 另一版本那轮的
新增材料）。收录标准是：排除安装内容、编译产物、工程文件、以及已经交付过的 zip
之后，剩下的东西。

**这些文件都不参与任何构建**。想只保留工程的话，整个包可以直接忽略。

---

## 逐项说明

### `01_decompiled_slices/core/` —— 27 个 `*.core.c`

从 `/data/inputs/*.exe.c`（Ghidra 反编译产物）里**抽出函数定义拼成的"核心代码"快照**，
去掉了数据段、类型声明、全局变量列表和大段注释，每个文件只留 6 个左右真正有用的
函数（`arout` / `txar` / `limit` / `type0` / `precursor` / `expand` / `compare0` …）。

用途：最早逐行复原时，用来快速看一个记号的骨架长什么样、和别的记号是不是同构
（结论是"27 个都是同一份骨架"）。**内容是原文节选，未改动**，不是可编译源码。

### `01_decompiled_slices/fns/` —— 338 个 `.c`，27 个子目录

把每个反编译产物**按函数切成单文件**，一个记号一个目录。命名带序号，例如：

```
fns/0-Y/00_arout.c
        01_txar.c
        02_limit.c
        03_type0.c
        04_precursor.c
        05_expand.c
        06_compare0.c
        07_main.c
        08_name0.c
        09_pare.c
        10_comp.c
```

用途：复原时一个函数一个函数对着看，也便于用 diff 比对不同记号之间同名函数的差异
（比如找出 Bashicu 系五六个记号的 `expand` 只差几行）。**逐字从 exe.c 原文切出，
未改动**。27 个子目录对应第一批 27 个 C++ 记号。

### `02_abandoned_draft/package.json` —— 废弃草稿

工作区里有个大写目录 `ONP2-TS/`，里面只有这一个文件（`src/`、`tests/` 都是空目录）。
那是最初想把 TS 工程叫 `onp2-notations` 时写的草稿 `package.json`；后来改成小写
`onp2-ts/` 并重写了 scripts，这个壳就废弃了。

它和正式工程 `onp2-ts/package.json` 的区别：草稿里有 `crosscheck` 脚本、
`build` 输出到 `dist/onp2.mjs`（正式版改成 30 个自包含 `plugins/*.plugin.js`）。

### `03_stray_probes/lels_probe.mjs` —— 漏删的临时探测脚本

排查 `validate("(0,0,0)(0,0,1)")` 返回 false 时写的探针：打印 typeOf / validate /
fsLimit / fs / compare 的几个组合。`integration/tests/` 里那份已经删了，
`onp2-ts/tests/` 里这份忘了删，留在了工程目录里。

**注意它跑不通**：`import` 写的是 `../src/engine/host`，是 `integration/` 的路径，
放在 `onp2-ts/` 下找不到模块。属于纯残留，不是正式测试
（正式的测试是 `diff.cjs` 和 `verify-plugins.mjs`）。

### `04_diagnostics_rebuilt/` —— 6 个诊断脚本（重建）

原本写在 `/tmp`（工作区**外**），上一轮整理时 `/tmp` 已被环境清空，按记录重建了
有复用价值的那几份：LELS 原始源码对拍、validate 执行链追踪、30 记号的
validate/compare 体检、远端仓库 blob SHA 比对等。详见该目录下的 `README.md`。

### `05_pps4_v2/` —— PPS4 另一版本这轮的临时材料

解析 11/7 那份新版 `Parented Predecessor Sequence 4.exe.c`、写出 `pps4_v2` 时
产生的中间文件：新版 exe.c 的函数区摘录、两版逐函数 diff、546 条命令对拍输出、
txar 步进审计，以及 3 个重建的诊断脚本。详见该目录下的 `README.md`。

**注意**：旧版 `Parented Predecessor Sequence 4.exe.c` 已被新版覆盖，
`01_decompiled_slices/core/` 里那份 `.core.c` 切片现在是唯一的旧版基准。

---

## 明确没有收录的

| 类别 | 具体 |
|---|---|
| 已交付的 zip | `ONP2.zip`、`onp2-ts.zip`、`ordinal-interface-integration.zip` |
| 工程文件 | `ONP2/`、`ONP2.NET/`、`onp2-ts/`、`integration/`、`repo/`（含各自的 README、tests、docs） |
| 安装内容 | `integration/node_modules/`（41 MB）、全局 npm 包 |
| 编译 / 打包产物 | `ONP2/bin/`（30 个可执行）、`onp2-ts/dist/`、`onp2-ts/dist-cjs/`、`onp2-ts/plugins/*.plugin.js`、`__pycache__/`、`integration/tests/*.bundle.mjs`、`/tmp/probeout*`、各类 `.pyc` |
| 你给的原始输入 | `/data/inputs/`（32 个文件：30 个反编译产物 + `LELS.cpp` + `lels.html`）—— 不是我写的，你手上本来就有。**例外**：11/7 新版 PPS4 的函数区摘录收在 `05_pps4_v2/`，因为它属于解析时产生的中间材料 |
| 工程文档 | `INTEGRATION.md`、各工程的 `README.md` / `README_EN.md`、`docs/` 下的移植依据文档。**例外**：`docs/pps4-v2-changes/` 这轮按你的要求单独打包成 `pps4-v2-changes.zip`，不在本包里重复放 |

## 一点说明

`core/` 和 `fns/` 严格说是**从你的输入派生出来的中间材料**，不是"我编写的代码"。
按你括号里给的范围（"工作区里除安装内容、编译产物和工程文件外的其他东西"）它们
确实落在里面，所以一并收了；如果只想要我写的脚本，看 `02_` `03_` `04_` 三个目录就行。

原始 exe.c 本身在 `/data/inputs/`，这个包里没有重复放。

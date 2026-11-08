# 变更记录

> 按时间倒序。代码层面的修正与取舍详见 [`IMPLEMENTATION-NOTES.md`](./IMPLEMENTATION-NOTES.md)；
> 本文件记录**每轮动了哪些文件、资料从哪里来**，便于对照交付包与工作区存档。

---

## 2026-11-08（第三轮）：性能优化落地、展开树 OOM 护栏、全记号测速

来源：用户要求「把这些改动（包括 PPS4 那些）都落地，B 组那些也可以试一下」。
完整技术记录见 [`performance.md`](./performance.md)，原始数据见
[`bench-baseline.json`](./bench-baseline.json)。

**硬约束**：本轮不改任何记号的输出，也不改与序数尺 / 展开树 / `validate` 逼近链
的组合行为。全量输出快照（30 记号 × 8 语料 × 6 次调用 + 64 组 `less`）优化前后
**JSON 逐字相同**，FNV-1a 哈希 `1506148283` 固化进回归组 D。

### 1) A 组：纯内部优化（5 个文件）

| 文件 | 改动 |
|---|---|
| [`../src/notations/core/matrix.ts`](../src/notations/core/matrix.ts) | `matrixCompare()` 去掉 `concat(pad)` 与每行两次 `slice`，改成按偏移直接比 300 格 |
| [`../src/notations/core/seq.ts`](../src/notations/core/seq.ts) | `seqCompare` / `seqCompare1` 去掉多余的 502 元素数组 |
| [`../src/notations/core/notation.ts`](../src/notations/core/notation.ts) | `pred()` 空序列返回 `[]`；`pm` 改空数组 + `usePm` 开关 |
| [`../src/notations/zero_y.ts`](../src/notations/zero_y.ts)、[`../src/notations/zero_y_super_non_lifting.ts`](../src/notations/zero_y_super_non_lifting.ts) | 打开 `usePm = true`（全仓库仅这两个记号读 `pm`） |
| [`../src/notations/core/bms.ts`](../src/notations/core/bms.ts) | 301 元素数组不再预填 0，未写位置按 `?? 0` 读 |

### 2) B 组：试过之后的落地与调整

- **B6 `txma` 线性解析**：落地为「快路径 + 回退」。新增 `txmaFast()` 单游标扫描
  标准矩阵串；嵌套 / 未闭合 / 非数字 / 尾部多余内容一律返回 `null`，交给
  `txmaLegacy()`（原逐字符模拟，原样保留）。同进程 A/B 实测纯解析 **1.25×**，
  真实语料 68 条快路径 68/68 命中。
- **B7 `matrixType0` 只解析末行**：**换了形态**。`ymode 0/1` 的列数推断依赖第 2 行，
  只解析末行拿不到 `cols`；等价收益改由 A4 取得。
- **A4 合并解析**：新增 `matrixParse()`，一次解析同时给出 `m / rows / cols /
  typeCode`；`MatrixNotation.fs()` 把原本的两遍解析合并。`matrixType0()` 保留轻量
  实现，不给 `typeOf()` 添复合对象分配。

### 3) 展开树连续展开护栏（bug 修复）

[`../src/core/tree.ts`](../src/core/tree.ts) 加 `CONTINUOUS_EXPAND_GUARD = 10_000`：
`click(..., continuous=true)` 的 `for(;;)` 单次最多插入 1 万节点。
四个 PPS4 弱化变体（`pps4_weak` / `pps4_second` / `pps4_third` /
`pps4_extremely_weak`）原本连续展开出的新节点始终判为极限，15 秒吃满 1 GB 堆
后 V8 直接 OOM；现在同步返回、行数停在 10003，耗时 5~28 ms。
**只加护栏、不改展开规则**；正常记号连续展开 8 次的行数与优化前逐字一致。

### 4) 测速工具与回归

| 新文件 | 内容 |
|---|---|
| [`../tests/bench_notations.mjs`](../tests/bench_notations.mjs) | 覆盖全部 30 个记号的基准：5 个协议原语 + `firstExceeding` / `validate` 冷路径 + 序数尺 draw / wheel / 展开树 click；每记号独立子进程 + timeout + 堆上限 |
| [`../package.json`](../package.json) | 新增 `npm run bench:notations` |
| [`bench-baseline.json`](./bench-baseline.json) | 同进程 A/B 加速比 + 落地前 / 后全 30 记号原始数值 |
| [`performance.md`](./performance.md) | 热点定位、A/B 组取舍、验证、明确不改项、复现命令 |

[`../tests/verify_notations.mjs`](../tests/verify_notations.mjs) 新增 **D 组 4 条**
（95 → 99）：D1 全量输出快照哈希、D2 40 条畸形矩阵串逐字一致、
D3 四个弱化变体连续展开不再 OOM 且行数有界、D4 正常记号连续展开 8 次行数不变。

### 5) 收益（同进程 A/B，优化前 / 后两份 bundle 同时载入、交替调用、5 轮中位数）

| 指标 | 10 个代表记号 | 矩阵系 7 个 |
|---|---|---|
| `fs` | **1.60×** | **1.75×** |
| `less` | **1.47×** | **1.53×** |
| `firstExceeding` | **1.37×** | **1.40×** |
| `typeOf` / `pred` / `fsLimit` | 1.01× / 1.02× / 0.99×（持平） | — |

> 上一轮评估里跨批次测出的 `less 2.18×` 受机器负载影响，本轮一律以同进程 A/B 为准。

### 6) 验证

| 项 | 结果 |
|---|---|
| 全量输出快照逐字一致 | ✅ |
| `txma` 快路径 / 回退差分 fuzz：3527 语料 × 2 种 C × 3 种 ymode = **21162 组** | **0 mismatch** |
| `verify:notations` | **99 / 99** |
| `verify` / `check-names`（30 一致）/ `integration`（30 记号 0 失败）/ 前端打包 | ✅ |
| `bench:notations` 全 30 记号 | **0 异常**（护栏修好后 4 个弱化变体不再 OOM） |
| 仓库内文件名全 ASCII / 导引文档相对链接 | 0 个非 ASCII / 0 个失效 |

### 7) 明确未纳入

`txar()` 的固定 501 预分配（改成短数组会让 `zero_y` 的 `fs` 慢 2 倍）、
`Int32Array`（越界写静默丢失会改语义）、`fs(n)` 块数偏移与各记号 `ex()` 规则、
`firstExceeding` 二分 / `BoundedCache`、LELS / RRSS / RCS / PPS 家族的定义层偏差。
理由见 [`performance.md`](./performance.md) 第六节。

---

## 2026-11-08（第二轮）：全 ASCII 文件名 + 对拍工具入库

来源：用户要求「整个仓库不要出现中文文件名」，并指出对拍工具没写进文档。

### 1) 文件名规范化

上一轮交付 zip 里 `docs/reviews/` 仍有 **14 个中文文件名**（11 份审查报告 +
`审查基准材料汇编.md` / `不一致明细.txt` / `对拍报告.json`），且 zip 未设 UTF-8
标志，在部分工具里显示为乱码。本轮统一改为 ASCII 并重建交付包：

| 原名 | 现名 |
|---|---|
| `0-Y实现审查报告.md` 等 10 份 + `Parented_BMS源码对照报告.md` | `audit-0-Y.md` … `audit-RRSS.md`、`audit-Parented-BMS-source.md` |
| `审查基准材料汇编.md` | `audit-reference-materials.md` |
| `不一致明细.txt` | `audit-diff-details.txt` |
| `对拍报告.json` | `audit-crosscheck-summary.json` |

所有引用这些文件的链接（[`README.md`](./README.md)、根 README、`reviews/README.md`、
`process-artifacts/README.md`、`CHANGELOG.md`）同步更新，校验 0 个失效链接。

**正文里残留的历史中文名也一并清理**：`ONP2协议与还原说明.md` 的 6 处引用
（`ONP2-protocol-and-restoration.md`、`original-vb-project.md`、`src/core/state.ts`
注释、还原出的 VB 工程 `.vbproj` / `.vb` / README）改为 ASCII 名并加注；
`审查文稿_11篇+基准汇编.zip` 改为 `audit-reports-and-reference.zip`。
这些改动只涉及文件名引用，不改技术内容。

**保留的例外（外部数据，不是仓库内文件名）**：

- `tools/crosscheck.py` 里 `EXE_MAP` 的**值**：用户提供的 26 个原始 exe 名
  （含 `0-Y超无提升`、`BMS行延伸无ceiling`、`LELS(ω进制阵)` 等），脚本按原名查找，必须逐字保留；
- `reviews/audit-crosscheck-summary.json` 数据里记录的原 exe 名；
- 「原名 → 现名」对照表里出现的旧名（`tools/README.md`、本文件、`crosscheck.md`）。

约定写入 [`README.md`](./README.md) 的 G 组、根 README / README_EN 的文档章节、
[`tools/README.md`](../tools/README.md)。

### 2) 对拍工具入库

| 新文件 | 来源 / 内容 |
|---|---|
| [`../tools/crosscheck.py`](../tools/crosscheck.py) | 原 `对拍.py`。改为 ASCII 产物名与输出目录；`--repo` 默认指向 `tools/` 的上一级（仓库根）；docstring 里的命令改成 `python tools/crosscheck.py` |
| [`crosscheck.md`](./crosscheck.md) | 原 `对拍使用说明.md`。补齐 26 个 exe 映射、EOF 后退出的进程模型、报告判读、参数速查、C++ 替身自测、PPS4 替换后的映射说明、历史产物归档 |
| [`../tools/README.md`](../tools/README.md) | `tools/` 目录说明 + 原名→现名对照表 |

产物名也全部 ASCII 化（运行产物不进仓库）：

| 原名 | 现名 |
|---|---|
| `对拍结果/` | `crosscheck-results/` |
| `对拍报告.json` | `crosscheck-report.json` |
| `不一致明细.txt` | `diff-details.txt` |
| `命令与结果.jsonl` | `commands.jsonl` |
| `握手名不一致.txt` | `name-mismatch.txt` |

**验证**：`python tools/crosscheck.py --help` 正常；`py_compile` 通过；
拿 `docs/restored/cpp/bin` 的 C++ 复原版当替身跑 `zero_y` / `stos` 共 148 条命令，
四个 ASCII 产物全部生成、报告结构正确（差异是 C++ 替身的已知口径，见 `crosscheck.md` 末节）。

### 3) 导引更新

[`README.md`](./README.md)（快速导航 + 目录树 + F/G 两组 + 文件名约定）、
根 [`../README.md`](../README.md) / [`../README_EN.md`](../README_EN.md)
（目录树 + 文档表格 + 约定注记）、[`../INTEGRATION.md`](../INTEGRATION.md)（导航表）、
[`reviews/README.md`](./reviews/README.md)（产物归档来源 + 怎么读第 5 条）、
[`process-artifacts/README.md`](./process-artifacts/README.md)、
[`IMPLEMENTATION-NOTES.md`](./IMPLEMENTATION-NOTES.md)（交叉验证工具入口）。

**校验**：仓库内文件名与交付 zip 条目 **100% ASCII**；
14 份导引文档相对链接 0 失效；`verify` / `check-names`（30 个一致）/
`verify:notations`（95/95）/ `integration` / 前端打包全通过。

---

## 2026-11-08（第一轮）：删除旧 PPS4，v2 提升为唯一的 `pps4`

来源：用户确认 11/1 那份 `pps4` 复原版有问题（与用户提供的 exe 在命令 4 上不符），
按 [`pps4-v2.md`](./pps4-v2.md) 与 [`pps4-v2-changes/`](./pps4-v2-changes/README.md)
已记录的两版对照，把 11/7 的实现扶正。

### 代码

| 动作 | 文件 |
|---|---|
| 删除 | `src/notations/pps4_v2.ts`、`docs/restored/cpp/notations/pps4_v2.cpp` |
| 替换内容 | `src/notations/pps4.ts`、`docs/restored/cpp/notations/pps4.cpp`（改用 `DEC_SCAN_LE_WIDE`，`name` / `name0()` 去掉 `(v2)` 后缀） |
| 注册表 | `src/notations/index.ts`（31 → 30）、`src/engine/plugins.ts`（删 `pps4_v2` 的 `NOTATION_NAMES` 与 `BUILTINS` 条目） |
| 共通框架 | `src/notations/core/seq.ts`、`docs/restored/cpp/common.h`：删 `DEC_SCAN_LE` 枚举与分支（数值 1 留空号），简化 `ppsEx` 的 `default` 分支；`DEC_SCAN_LE_WIDE` 的注释改为「当前 PPS4」 |
| 构建脚本 | `docs/restored/cpp/Makefile` / `main.cpp` / `test.py` 注释里的 27 / 31 → 30 |
| 页面 | `index.html`「其余 31 个记号」→ 30 |
| 测试 | `tests/verify_notations.mjs`：新增 A7「PPS4 替换」组（30 个记号、无 `pps4_v2`、name 无后缀），B 组 `pps4` 期望值换成 exe 口径并补 4 条用例；88 → **95** 条 |

**验证**：C++ `make` 产出 30 个可执行；`pps4` 的命令 4 在 C++ / TS 两侧逐条一致
（`0,1→0,0`、`0,1,2→0,1,1`、`2,1→2,2` 等）；
`verify` / `check-names`（30 个一致）/ `verify:notations`（95/95）全通过；
`integration` 30 个记号初始化 0 失败。

### 文档

| 文件 | 改了什么 |
|---|---|
| [`pps4-v2.md`](./pps4-v2.md) | 改写为「当前实现基准」：开头声明旧版删除、v2 扶正；命名节去掉 `(v2)`；`txar` 影响面 10 → 9 个记号；新增「2026-11-08 替换清单」一节 |
| [`README.md`](../README.md) / [`README_EN.md`](../README_EN.md) | 内置 33 → 32、复原 31 → 30、回归 88 → 95、docs 树与第十节表格的 PPS4 条目 |
| [`INTEGRATION.md`](../INTEGRATION.md) | 「PPS4 另一版本」附节改写为「PPS4 替换」，列变更表；文档导航拆成「当前实现」与「历史归档」两行 |
| [`./README.md`](./README.md) | 31 → 30；PPS4 快速导航与目录树条目；B 组补「归档是 11/7 快照」提示 |
| [`IMPLEMENTATION-NOTES.md`](./IMPLEMENTATION-NOTES.md) | §2.2 / §2.5 的 `pps4_v2` 表述改为替换说明；§3 / §4 计数 31 → 30 |
| [`reviews/README.md`](./reviews/README.md) | 审查对象注明「当时 31 个，现 30 个」 |
| [`process-artifacts/README.md`](./process-artifacts/README.md) | 27 + 4 → 27 + 3；注明 `pps4_v2` 已并入 `pps4` |
| [`restored/README.md`](./restored/README.md) / [`restored/cpp/README.md`](./restored/cpp/README.md) | 31 → 30；「关于 `pps4_v2.cpp`」改为「关于 `pps4.cpp`（替换）」；cpp README 附节补替换说明 |
| [`pps4-v2-changes/STATUS.md`](./pps4-v2-changes/STATUS.md) | **新增**：历史快照的状态提示（原归档内文件一字未改） |

**逐字保留、未改写**：`pps4-v2-changes/` 内 `01`~`04`、`scripts/README.md`、
`changed-files/`、`02-behavior-diff.txt`；`process-artifacts/` 内 4 份原件；
11 份审查报告与 `audit-reference-materials.md`。这些文件里的 `pps4_v2` 路径与计数
是**当时的状态**，由新增的 `STATUS.md` 与上述导引层说明统一交代。

---

## 2026-11-07（第三轮）：文档补充与导引更新

来源：用户提供的 3 个工作区临时包（扩展名 `.txt`，实为 ZIP）与此前 11 份实现审查文稿。

### 新增到 `docs/`

| 路径 | 文件数 | 内容 |
|---|---|---|
| `docs/reviews/` | 14 | 11 份实现审查 / 源码对照报告、`audit-reference-materials.md`、`audit-diff-details.txt`、`audit-crosscheck-summary.json`，全部逐字归档；另新写 `README.md` 索引 |
| `docs/pps4-v2-changes/` | 22 + 2 | PPS4 v2 修正的完整归档（原包全量：`01`~`04`、`02-behavior-diff.txt`、`scripts/`、`changed-files/`），另从临时包补入 2 份诊断原始输出 |
| `docs/process-artifacts/` | 5 | 3 个临时包的 4 份原始 README + 新写的 `README.md` 总索引 |
| `docs/CHANGELOG.md` | 1 | 本文件 |

**明确未纳入工程仓库**的过程产物：383 个 Ghidra 反编译切片、废弃草稿、漏删探针、
`workspace-extras` 里的交付物副本 / tarball 缓存 / 两份远端仓库快照。
清单、来源与「已删除且无法恢复」的文件见 [`process-artifacts/README.md`](./process-artifacts/README.md)。

### 重写的导引文档

| 文件 | 改了什么 |
|---|---|
| [`README.md`](./README.md) | 改为 `docs/` 总导航：按用途的快速导航表、完整目录树、五组分组说明；保留原有 VB 标识符对照与已修 bug 表；修正「原 VB 源码未收入本仓库」的过时表述 |
| [`../README.md`](../README.md) | 目录树补 `verify_notations.mjs` 与 docs 三组新目录；第十节「移植依据文档」扩为完整文档导航；致谢补资料来源 |
| [`../README_EN.md`](../README_EN.md) | 同步更新目录树与第 10 节 Documentation（英文） |
| [`../INTEGRATION.md`](../INTEGRATION.md) | PPS4 两处链接指向完整归档与 `03-txar-fix.md`；末尾加「文档导航」附节 |
| [`restored/README.md`](./restored/README.md) | 开头加上级文档导航；PPS4 链接补完整归档 |
| [`restored/cpp/README.md`](./restored/cpp/README.md) | 开头加上级文档导航 |
| [`IMPLEMENTATION-NOTES.md`](./IMPLEMENTATION-NOTES.md) | 开头补配套资料导航 |

**逐字保留、未改写**的细分文档：11 份审查报告、`audit-reference-materials.md`、
`pps4-v2-changes/` 内 `01`~`04` 与 `scripts/README.md`、`process-artifacts/` 内 4 份原件、
`pps4-v2.md`、`ONP2-protocol-and-restoration.md`、`original-vb-project.md`，
以及 `restored/vb/` 下还原出的原 VB 工程 README（文件名带 `docs__restored__vb__` 前缀，
按原工程目录结构保留，`.vbproj` 要能直接构建，不宜改动）。
这些文档中的路径按**原包内视角**书写，个别指向工作区或已交付 zip，不是本仓库路径。

> 「导引性 README」与「某次更改的细分归档」的边界：本轮改的是根 `README.md` /
> `README_EN.md`、`docs/README.md`、`docs/restored/README.md`、
> `docs/restored/cpp/README.md` 与 `INTEGRATION.md` 这类导航文件；
> `docs/pps4-v2-changes/README.md` 与 `scripts/README.md` 是 PPS4 那轮更改的
> 归档总说明，按原样保留，只在导引层登记，不改写。

### 校验

- 10 份导引文档的相对链接全部解析成功（0 个失效）。
- 代码与测试未改动；`npm run verify` / `check-names` / `verify:notations`（**当时** 88 条）
  / `integration`（**当时** 31 个记号初始化 0 失败）结果见
  [`IMPLEMENTATION-NOTES.md`](./IMPLEMENTATION-NOTES.md) §3。11/8 替换 PPS4 后分别为
  95 条与 30 个记号。
- `docs/` 不在 `tsconfig.json` 的 `include`（`["src"]`）里，也不被 vite 处理，
  增删文档不影响 `npm run build`。

---

## 2026-11-07（第二轮）：实现审查后的代码修正

改了 12 个 `.ts` 文件，新增 `tests/verify_notations.mjs`（88 条回归）与
[`IMPLEMENTATION-NOTES.md`](./IMPLEMENTATION-NOTES.md)：

- 修：两位数矩阵解析、零表达式 `typeOf`、`fsLimit` 统一 0-based、零/后继 `fs` 短路、
  `pred` 协议、CpS / LELS / 0-Y 的死循环与栈溢出护栏。
- 保留：`fs(n)` 块数偏移、PPS 家族三处实质偏差、LELS 差值表与坏根、RCS fallback、
  RRSS 坏根与降链、`less` 字典序、PPM 名字归属——理由见 `IMPLEMENTATION-NOTES.md` §2。
- 同步更新 `README.md` / `README_EN.md` / `INTEGRATION.md` / `package.json`，
  加 `npm run verify:notations` 脚本。

判定依据：11 份实现审查报告（现归档于 [`reviews/`](./reviews/README.md)）。

---

## 2026-11-07（第一轮）：PPS4 另一 exe 版本

用户提供了第二份 `Parented Predecessor Sequence 4.exe.c`（覆盖 11/1 那份），
新增记号 `pps4_v2`（注册表 30 → 31），并顺带修正 `txar()` 步进公式。
完整归档见 [`pps4-v2-changes/README.md`](./pps4-v2-changes/README.md)，
当前实现说明见 [`pps4-v2.md`](./pps4-v2.md)，工程侧说明见
[`../INTEGRATION.md`](../INTEGRATION.md) 的「附：PPS4 替换」。
> 该节的 `pps4_v2` 是 11/7 的临时命名，2026-11-08 已扶正为 `pps4` 并删除旧版，
> 见本文件「2026-11-08（第一轮）」一节。

---

## 更早

- 复原记号接入宿主 / 序数尺 / 展开树（现 30 个）：[`../INTEGRATION.md`](../INTEGRATION.md)
- 性能优化与 185 项自检脚本：见根 README 的性能章节与 `tests/verify.ts`
- 网页版移植本身与协议依据：[`ONP2-protocol-and-restoration.md`](./ONP2-protocol-and-restoration.md)、
  [`original-vb-project.md`](./original-vb-project.md)

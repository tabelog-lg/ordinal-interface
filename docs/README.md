# 文档导航

> 本目录收录网页版移植的**全部文档**：移植依据、复原源码、实现基准与审查报告、
> 变更归档、过程性资料。`docs/` 不在 `tsconfig.json` 的 `include`（`["src"]`）里，
> 也不会被 vite 处理，**不参与构建**，可以任意增删而不影响页面。
>
> 根目录的 [`../README.md`](../README.md) / [`../README_EN.md`](../README_EN.md)
> 是工程主说明；本文件是文档层的索引。

---

## 快速导航（按用途）

| 想做什么 | 去哪 |
|---|---|
| 跑起来 / 看命令、页签、插件机制 | [`../README.md`](../README.md)、[`../README_EN.md`](../README_EN.md) |
| 了解 30 个记号怎么接进宿主的 | [`../INTEGRATION.md`](../INTEGRATION.md) |
| 搞清楚「为什么 `fs(n)` 比定义多一块」 | [`./IMPLEMENTATION-NOTES.md`](./IMPLEMENTATION-NOTES.md) §2.1 |
| 查某记号与 Wiki 定义差在哪 | [`./reviews/README.md`](./reviews/README.md) → 对应报告 |
| 核对审查用的定义原文 | [`./reviews/audit-reference-materials.md`](./reviews/audit-reference-materials.md) |
| 查 PPS4 当前实现的依据与两版对照 | [`./pps4-v2.md`](./pps4-v2.md)（历史归档 [`./pps4-v2-changes/README.md`](./pps4-v2-changes/README.md)） |
| 找反编译切片 / 快照 / 已删文件去哪了 | [`./process-artifacts/README.md`](./process-artifacts/README.md) |
| 逐行对照 ONP2 协议与混淆名还原 | [`./ONP2-protocol-and-restoration.md`](./ONP2-protocol-and-restoration.md) |
| 编译 C++ / C# / VB 复原版做对拍 | [`./restored/README.md`](./restored/README.md) |
| 用 26 个 exe 对拍 TS 记号、读报告 | [`./crosscheck.md`](./crosscheck.md) → [`../tools/crosscheck.py`](../tools/crosscheck.py) |
| 跑回归测试 | [`../tests/verify_notations.mjs`](../tests/verify_notations.mjs)（`npm run verify:notations`） |
| 查每轮动了哪些文件、资料从哪来 | [`./CHANGELOG.md`](./CHANGELOG.md) |

---

## 目录总览

```
docs/
├─ README.md                        本文件：文档总导航 + VB 标识符对照 + 已修 bug
├─ CHANGELOG.md                     ★ 变更记录：每轮改了哪些文件、资料来源、未纳入项
├─ ONP2-protocol-and-restoration.md 协议条文、逆向核对表、混淆名→还原名、配置文件格式
├─ original-vb-project.md           原桌面程序 README（目录结构、编译、用法、已知问题）
├─ IMPLEMENTATION-NOTES.md          ★ 实现基准、2026-11-07/08 修正清单、明确不改的偏移与理由
├─ crosscheck.md                    ★ 对拍工具：TS 记号 ⇄ 26 个 exe，用法/映射/判读口径
├─ pps4-v2.md                       PPS4 当前实现基准（原 v2；旧版已删除）
├─ reviews/                         ★ 11 份实现审查报告 + 基准原文 + 差分数据（15 个文件）
│  ├─ README.md                      索引：结论速览、报告↔本轮修正的对应
│  ├─ audit-*.md                    11 份审查 / 源码对照报告
│  ├─ audit-reference-materials.md 846 行，全部外部基准逐字汇编
│  ├─ audit-diff-details.txt        47 KB 差分原始输出
│  └─ audit-crosscheck-summary.json 26 个记号 exe ↔ TS 逐条对拍汇总（crosscheck.py 产物归档）
├─ pps4-v2-changes/                 ★ PPS4 替换的历史归档（11/7 快照，原包全量）
│  ├─ README.md                      11/7 归档总说明（历史快照，逐字保留）
│  ├─ STATUS.md                      ★ 2026-11-08 状态提示：v2 已扶正，旧版已删
│  ├─ 01-reversed-diff.md            两版 exe.c 逐函数对照 + Ex() 精确 diff
│  ├─ 02-behavior-diff.txt           546 条命令对拍的全部 53 条差异
│  ├─ 03-txar-fix.md                 txar 步进公式偏差的推导与影响范围
│  ├─ 04-file-manifest.md            9 新增 / 6 修改的逐文件清单
│  ├─ diagnostics-*.txt              从临时文件包补入的 2 份诊断原始输出
│  ├─ scripts/                       3 个诊断脚本 + 用法说明
│  └─ changed-files/                 改动文件副本（repo / onp2-ts / cpp 三套）
├─ process-artifacts/               ★ 过程性资料总索引（4 份原件 + 清单）
│  ├─ README.md                      三个临时包的内容、来源、未纳入项、已删项
│  ├─ temp-files.md                  383 条目的逐项说明
│  ├─ diagnostics-rebuilt.md         6 个重建诊断脚本与两个复现坑
│  ├─ pps4-v2-temp.md                PPS4 v2 那轮的中间材料
│  └─ workspace-extras.md            交付物副本 / 缓存 / 远端快照说明
└─ restored/                        ★ 可编译的复原产物（移植依据）
   ├─ README.md                     总说明与对拍流程
   ├─ cpp/                          30 个记号的 C++ 复原版（make 可构建）
   ├─ csharp/                       第二批 3 个的 C# / VB.NET 复原版
   ├─ lels-original-source/         LELS 作者原始 C++ 源码
   └─ vb/                           还原出的完整 VB.NET 工程
```

---

## 分组说明

### A. 实现基准与审查（2026-11-07 新增）

[`reviews/`](./reviews/README.md) 是 11 份实现审查报告与配套基准的逐字归档，
[`IMPLEMENTATION-NOTES.md`](./IMPLEMENTATION-NOTES.md) 是本轮按报告修完之后的口径说明。

**读的顺序**：审查报告写的是**修正前**的状态，结论里大量 ❌ 属于「复原 exe 的 ONP2
输出口径」与「Googology Wiki 定义」的基准差异，不是全部都要改。哪些已修、哪些
有意保留及理由，一律以 `IMPLEMENTATION-NOTES.md` 为准；回归用例在
[`../tests/verify_notations.mjs`](../tests/verify_notations.mjs)。

### B. 变更归档

[`pps4-v2-changes/`](./pps4-v2-changes/README.md) 对应 11/7 用户提供的第二份
`Parented Predecessor Sequence 4.exe.c`：同一记号的第五份实现，只有 `Ex()` 的
降级扫描下界不同。该目录是**不依赖其它文件的完整展开版**，
[`pps4-v2.md`](./pps4-v2.md) 是当前实现的技术说明（原为简要版）。**2026-11-08 起**
该归档所述的 v2 已提升为唯一的 `pps4`，旧版与 `pps4_v2` 条目均已删除，
注册表 31 → 30；归档里的 `pps4_v2` 路径、计数与「两版并存」表述是当时的状态。
目录内文件按原归档逐字保留，未改写；
文中出现的工作区路径、已交付 zip 名与原包内相对路径均为**当时的视角**，不是本仓库路径。
本轮另外从临时文件包补入了两份诊断原始输出 `diagnostics-ex_slice_diff.txt` /
`diagnostics-txar_step_audit.txt`（`02-behavior-diff.txt` 与临时包里那份内容相同，未重复收）。

顺带修正的 `txar()` 步进公式（当时影响 10 个 `bias=1` 记号，PPS4 合并后为 9 个）
见该目录 `03-txar-fix.md`；本仓库的回归断言在 `verify_notations.mjs` 的 A6 组。

### C. 过程性资料

[`process-artifacts/`](./process-artifacts/README.md) 只收**说明**，不收过程产物本体。
三个临时包（扩展名 `.txt`、实为 ZIP）里的反编译切片、远端快照、tarball 缓存、
编译产物不进工程仓库；清单、来源、以及「哪些已删除且无法恢复」都在那里登记。

### D. 移植依据

`ONP2-protocol-and-restoration.md` 与 `original-vb-project.md` 的内容**未作改动**，
只各加了一段说明出处的小节；文件名由原来的中文名改为纯 ASCII，
方便在 GitHub Pages 与各类工具链里引用。
下方「VB 标识符 ↔ 网页版实现对照」给出混淆名 → 还原名 → 网页版位置的逐行对照。

### E. 复原产物

[`restored/`](./restored/README.md) 里的 VB 源码保留原文件名与目录结构
（`My Project\AssemblyInfo.vb` 照原样放在子目录下），这样 `.vbproj` 不用改就能直接构建。
`cpp/` 下的 30 个可执行是 TS 插件的逐条对拍基准。

### F. 对拍工具（2026-11-08 入库）

[`crosscheck.md`](./crosscheck.md) 是 [`../tools/crosscheck.py`](../tools/crosscheck.py) 的使用说明：
同一批命令流分别喂给 exe 与 TS 打包出的 ONP2 控制台程序，逐行比输出。
内含 26 个 exe 的映射表、EOF 后不退出的进程模型、报告判读口径与参数速查。
历史轮次用真实 exe 跑出的两份结果按 ASCII 名归档在 `reviews/`。

### G. 文件名约定

**仓库内所有文件名一律 ASCII**（含 `docs/`、`tools/`、`src/`、`tests/` 及交付 zip 内的条目）。
2026-11-08 把上一轮残留的 14 个中文文件名（`docs/reviews/` 下的审查报告与差分数据）
统一改为 `audit-*.md` / `audit-*.txt` / `audit-*.json`，并把 `对拍.py` 与
`对拍使用说明.md` 以 `tools/crosscheck.py` / `docs/crosscheck.md` 入库。
文档正文里提到的旧中文名仅出现在「原名 → 现名」对照表中，见
[`../tools/README.md`](../tools/README.md) 与 [`CHANGELOG.md`](./CHANGELOG.md)。

**例外是外部数据，不是仓库内文件名**：`crosscheck.py` 的 `EXE_MAP` 值
（用户提供的 26 个原始 exe 名，含中文与希腊字母）、`reviews/` 归档数据里
记录的原 exe 名，以及移植依据原文中提到的历史资料名。这些按原名保留，
因为脚本要按原名查找文件、报告要如实复现当时的输入。

---

## VB 标识符 ↔ 网页版实现对照

还原项目把反编译产物里的混淆名（`Class1`、`Sub3`……）重新命名成了英文标识符，
网页版沿用了这套命名。下表给出「混淆名 → 还原名 → 网页版落在哪里」，便于照着原代码逐行核对。

### 数据结构与字段

| 混淆名 | 还原名 | 网页版位置 |
|---|---|---|
| `Class1` | `RulerNode` | `src/core/ruler.ts` |
| `Structure1` | `TreeNodeInfo` | `src/core/tree.ts` |
| `Class1_1 / _2 / _3` | `rootNode / lowerNode / upperNode` | `RulerEngine` 的同名字段 |
| `LinkedList1` | `expansionTree` | `src/core/dlist.ts` 的 `DList` |
| `LinkedListNode1(0/1)` | `treeFirstVisible / treeCursor` | `TreeEngine.firstVisible` / 局部变量 |
| `Process1 / Process2` | `engineProcess / probeProcess` | `src/engine/host.ts`（`probeProcess` 已删除） |
| `Single1(0/1)` | `viewCenter / viewSpan` | `RulerEngine` |
| `SolidBrush1(0/1)` | `normalBrush / limitBrush` | `settings.normalColor / limitColor` |
| `Boolean1` | `engineReady` | `EngineHost.ready` |
| `Collection1` | `pluginPaths` | `src/engine/plugins.ts` |
| `String3(0/1)` | `savedPaths / savedNames` | `plugins.ts`（改存 IndexedDB） |
| `String1 / String2` | `cursorExpr / candidateExpr` | `host.validate()` 的局部变量 |
| `Byte1` | `colorBuffer` | 不再需要（JSON 直接存颜色） |
| `Integer1 / Integer2` | `tempIndex` / 一组布局量 | 拆成具名字段（`tickGap`、`tickLength` 等） |

### 方法

| 混淆名 | 还原名 | 网页版位置 |
|---|---|---|
| `Function2` | `QueryType` | `host.queryType()` |
| `Function3` | `GetPredecessor` | `host.getPredecessor()` |
| `Function4` | `GetFSTerm` | `host.getFSTerm()` |
| `Function5` | `IsLessThan` | `host.isLessThan()` |
| `Function6` | `FirstExceeding` | `host.firstExceeding()` |
| `Function7` | `ValidateExpression` | `host.validate()` |
| `Sub1` | `DrawRuler` | `RulerEngine.draw()` |
| `Sub2` | `DrawTicks` | `RulerEngine.drawTicks()` |
| `Sub3` | `CreateChild` | `RulerEngine.createChild()` |
| `Sub4` | `CreateSibling` | `RulerEngine.createSibling()` |
| `Sub5` | `OptionCheckedChanged` | `src/ui/settings.ts`（改用 CSS `[aria-pressed]`） |
| `Sub6` | `DrawTree` | `src/ui/treeView.ts` 的 `redraw()` |
| `Sub7` | `AlignModeChanged` | `src/ui/settings.ts` |
| `Sub8` | `TemporarilyTopMost` | **已删除**（网页里没有控制台窗口可抢焦点） |
| `Sub9` | `PickColor` | `<input type="color">` |
| `Sub10 / Sub11` | `ReadColor / WriteColor` | `src/core/state.ts` 的导入 / 导出 |
| `Sub12` | `RedrawAll` | `src/main.ts` 的 `redrawAll()` |
| `Button2_Click` | `ExpandOrdinal` | `src/ui/misc.ts` |
| `Button7_Click` | `ShowOrdinalType` | `src/ui/misc.ts` |
| `Button8_Click` | `CompareOrdinals` | `src/ui/misc.ts` |
| `Button9_Click` | `ShowPredecessor` | `src/ui/misc.ts` |
| `Button4_Click` | `AddNotation` | `src/ui/plugins.ts` |
| `Button3_Click` | `RemoveNotation` | `src/ui/plugins.ts` |
| `ListBox1_SelectedIndexChanged` | `SelectNotation` | `src/main.ts` 的 `selectNotation()` |

### 一处语义变化

`FirstExceeding` 在原程序里通过字段变量 `tempIndex` **以副作用的形式**返回找到的下标。
网页版改成显式返回 `{ expr, index }` —— 展开树那个 bug 的修复正好需要这个下标。

---

## 已修复的原程序 bug

还原说明里标了三处疑似原作者笔误，网页版都修掉了：

| # | 位置 | 原行为 | 网页版 |
|---|---|---|---|
| 1 | `TreeClick` | 首次展开后把**像素坐标**写进 `Levels(0)`，第二次点击把它当基本列下标继续 `+1` | 写入 `FirstExceeding` 真正用到的下标 |
| 2 | `SelectNotation` | 根节点 `Adjacent` 只有 4 槽（其它节点 6 槽），边界节点的邻接是 `Nothing` | 统一 6 槽，生不出节点时返回失败并夹紧视窗 |
| 3 | `ValidateExpression` | 靠 `engineProcess.Responding` 判断卡死，并对已运行进程调 `Start()`（抛异常且无 try/catch） | 改用迭代上限兜底 |

第 3 条在网页版里**必须**修：原程序靠"进程是否响应"判断，浏览器没有这个信号，
而该循环本身存在死循环路径，不加上限的话插件一有偏差整个页面就冻结。

> 复原记号层面的修正（2026-11-07）见 [`IMPLEMENTATION-NOTES.md`](./IMPLEMENTATION-NOTES.md) §1，
> 与本表是不同轮次、不同层次的两组修复。

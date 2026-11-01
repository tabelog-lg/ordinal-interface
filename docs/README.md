# 移植依据文档

本目录收录这次网页版移植所依据的**全部原始资料**，与源码一并归档，便于逐行对照。

| 路径 | 内容 |
|---|---|
| [`ONP2-protocol-and-restoration.md`](./ONP2-protocol-and-restoration.md) | ONP2 协议官方条文与逆向核对表、混淆名 → 还原名对照、两个核心算法的说明、配置文件字节级格式、编写插件的最小清单 |
| [`original-vb-project.md`](./original-vb-project.md) | 原桌面程序的 README（目录结构、编译方法、用法、已知问题） |
| [`restored/vb/`](./restored/vb/) | **还原出的完整 VB.NET 工程**（主项目 + 示例插件），目录结构按原样复原 |

## 关于文件名

`ONP2-protocol-and-restoration.md` 与 `original-vb-project.md` 的内容**未作改动**，
只各加了一段说明出处的小节；文件名由原来的中文名改为纯 ASCII，
方便在 GitHub Pages 与各类工具链里引用。

VB 源码保留原文件名与目录结构（`My Project\AssemblyInfo.vb` 照原样放在子目录下），
这样 `.vbproj` 不用改就能直接构建。

本仓库（网页前端版）的主说明见根目录的 [README.md](../README.md) / [README_EN.md](../README_EN.md)。

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

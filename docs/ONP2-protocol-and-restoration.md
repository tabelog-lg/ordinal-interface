# ONP2 协议与还原说明

> **关于本文档**
> 来自序数界面1 v1.5.4 的 VB.NET 还原项目，原文件名为中文，入库时统一为 ASCII：`ONP2-protocol-and-restoration.md`（即本文件）。
> 收入本仓库时文件名改为纯 ASCII，便于在 GitHub Pages 与各类工具链中引用；**内容未作改动**。
> 本仓库（网页前端版）的主说明见根目录的 [README.md](../README.md) / [README_EN.md](../README_EN.md)。

---

# 序数界面1 v1.5.4 —— 还原说明 & ONP2 协议

源文件：`Form1.cs`（反编译产物，2603 行）
还原结果：`Form1.vb`（英文标识符，中文注释）+ `Form1.Designer.vb`

---

## 一、这个程序到底是什么

一个**大可数序数记号（ordinal notation）的可视化浏览器**，出自中文 googology（大数）社区。
主界面五个页签：选择序数记号 / 杂项 / 展开树 / 序数尺 / 设置。

关键设计：**主程序不实现任何序数运算**。真正的记号系统由用户提供的外部控制台 exe
（「序数记号」插件）实现，主程序通过标准输入输出与之对话，握手串为：

```
Ordinal Notation Protocol 2
```

插件启动后必须先输出两行：第一行是上面这个握手串，第二行是该记号系统的名称
（显示在 ListBox 里）。主程序据此判定"这是一个合法的 ONP2 插件"。

---

## 二、ONP2 协议

### 2.1 官方协议原文（用户提供）

> 序数界面是面向用户的桌面程序。序数记号是控制台应用程序。
> 序数界面要想使用序数记号，就得打开序数记号，然后向序数记号发送问题，然后读取序数记号返回的结果。
> 序数记号要想被序数界面使用，就得发送消息 "Ordinal Notation Protocol 2" 和序数记号名称，
> 然后根据序数界面发送的问题返回结果。
> 序数界面发送的问题和序数记号返回的结果都是字符串，一共有 5 种问题：
>
> 1. 发送 2 条字符串（"1" 和有限数 a），返回字符串（序数记号表示极限的基本列的第 a 项）。
> 2. 发送 2 条字符串（"2" 和序数 a），返回字符串（a=0 返回 "1"；a 是后继序数返回 "2"；a 是极限序数返回 "3"）。
> 3. 发送 2 条字符串（"3" 和序数 a），返回字符串（a 的前继序数）。
> 4. 发送 3 条字符串（"4"、有限数 a 和序数 b），返回字符串（b 的基本列的第 a 项）。
> 5. 发送 3 条字符串（"5"、序数 a 和序数 b），返回字符串（a<b 返回 "2"，否则返回 "1"）。
>
> 如果序数记号要返回的序数为 0，那么返回字符串 "0"，否则返回其它的字符串。

### 2.2 逆向结果 vs 官方协议：逐条核对

从 `Form1.cs` 的 `Function2~Function5` 逆向出的协议，**与官方协议完全一致**，无一处偏差：

| 命令 | 官方说法 | 代码实证 | 一致 |
|---|---|---|---|
| 1 | `"1"` + 有限数 a → 极限（Limit）的基本列第 a 项 | `WriteLine("1\r\n" & a)`，仅当基准为 `Limit` 时发送 | ✅ |
| 2 | `"2"` + 序数 a → `"1"`=0 / `"2"`=后继 / `"3"`=极限 | `QueryType()`，程序侧另把 `Limit` 短路判为 `"3"` | ✅ |
| 3 | `"3"` + 序数 a → a 的前继序数 | `GetPredecessor()` | ✅ |
| 4 | `"4"` + 有限数 a + 序数 b → b 的基本列第 a 项 | `GetFSTerm()` | ✅ |
| 5 | `"5"` + a + b → a<b 返回 `"2"`，否则 `"1"` | `IsLessThan()`：返回 `"1"` 即判定 a ≥ b | ✅ |
| 0 | 序数为 0 时返回字符串 `"0"` | 程序侧常量 `0` 与 `Limit` 全程按字面量使用 | ✅ |

一处**协议没写、但代码里能看出来的补充**：

* 参数之间用 `\r\n` 分隔，一次 `WriteLine` 把命令号和参数一起发过去（例如命令 4 是
  `"4\r\n3\r\nLimit"` 一行写完），然后读一行结果。
* 程序侧对两个特殊串有短路：`Limit` 恒为极限序数、恒大于任何序数；`0` 恒为最小。
  所以命令 2 在 `expr = "Limit"` 时不会真的发给引擎，命令 5 在任一侧为 `Limit` 时也不发。
  插件实现时**仍应正确处理这两者**，因为其它路径（如命令 1、4）会真的传进去。

---

## 三、混淆标识符 → 还原后的名字

### 类与结构

| 混淆名 | 还原名 | 说明 |
|---|---|---|
| `Class1` | `RulerNode` | 序数尺上的一个刻度 |
| `Structure1` | `TreeNodeInfo` | 展开树上的一行 |

`RulerNode.Adjacent(0..5)` 的含义：

| 下标 | 含义 |
|---|---|
| 0 | 下界节点 |
| 1 | 上界节点 |
| 2 | 下子节点 |
| 3 | 上子节点 |
| 4 | 同层的前一个（更小的一侧） |
| 5 | 同层的后一个（更大的一侧） |

### 字段

| 混淆名 | 还原名 |
|---|---|
| `Class1_1 / _2 / _3` | `rootNode / lowerNode / upperNode` |
| `LinkedList1` | `expansionTree` |
| `LinkedListNode1(0/1)` | `treeFirstVisible / treeCursor` |
| `Process1 / Process2` | `engineProcess / probeProcess` |
| `Single1(0/1)` | `viewCenter / viewSpan` |
| `SolidBrush1(0/1)` | `normalBrush / limitBrush` |
| `Boolean1` | `engineReady` |
| `Collection1` | `pluginPaths` |
| `String3(0/1)` | `savedPaths / savedNames` |
| `String1 / String2` | `cursorExpr / candidateExpr` |
| `Byte1` | `colorBuffer` |
| `Integer1(0/1)` | `tempIndex / indentPixels`（拆开命名） |
| `Integer2(0..7)` | `treeScrollOffset / rulerCenterY / tickGap / rulerHalfHeight / denseTickLimit / captionOffset / tickLength / textHalfHeight` |
| `TreeNode1 / TreeNode2` | —— （原程序声明了但从未使用，已删除） |

### 方法

| 混淆名 | 还原名 | 作用 |
|---|---|---|
| `Function2` | `QueryType` | 命令 2 |
| `Function3` | `GetPredecessor` | 命令 3 |
| `Function4` | `GetFSTerm` | 命令 1 / 4 |
| `Function5` | `IsLessThan` | 命令 5 |
| `Function6` | `FirstExceeding` | 基本列中第一个超过甲的项 |
| `Function7` | `ValidateExpression` | 合法性校验 + 归一化 |
| `Sub1` | `DrawRuler` | |
| `Sub2` | `DrawTicks` | 递归绘制一段刻度 |
| `Sub3` | `CreateChild` | 按需生成上子/下子并接入链表 |
| `Sub4` | `CreateSibling` | 按需生成前一个/后一个同层节点 |
| `Sub5` | `OptionCheckedChanged` | 勾上变绿、取消变红 |
| `Sub6` | `DrawTree` | |
| `Sub7` | `AlignModeChanged` | 切换展开树对齐模式 |
| `Sub8` | `TemporarilyTopMost` | 启动子进程前置顶，1 秒后取消 |
| `Sub9` | `PickColor` | 三个取色按钮 |
| `Sub10 / Sub11` | `ReadColor / WriteColor` | 配置文件里的 RGB |
| `Sub12` | `RedrawAll` | |
| `Button2_Click` | `ExpandOrdinal` | 「展开序数」 |
| `Button7_Click` | `ShowOrdinalType` | 「返回序数类型」 |
| `Button8_Click` | `CompareOrdinals` | 「大小比较」 |
| `Button9_Click` | `ShowPredecessor` | 「返回前继序数」 |
| `Button4_Click` | `AddNotation` | 「添加序数记号位置」 |
| `Button3_Click` | `RemoveNotation` | 「删除序数记号位置」 |
| `ListBox1_SelectedIndexChanged` | `SelectNotation` | 选中一个记号系统 |

界面文案（原文，未改动）：表达式不正确 / 序号不正确 / 表达式不是极限序数 /
表达式不是后继序数 / 极限序数 / 后继序数。

---

## 四、两个核心算法（简述）

### 序数尺：可无限缩放的刻度树

`RulerNode` 同时是一棵**二分细分树**（2/3 指针）和一条**同层双向链表**（4/5 指针）。
节点**懒生成**：滚轮缩放到某一层，`CreateChild` / `CreateSibling` 才向引擎要下一批序数。
所以理论上可以沿着 ω、ε₀、Γ₀ …… 一直放大下去，内存只随可见刻度增长。

滚动方向：向下滚 = 拉远（视窗跨度变大），到阈值 `0.25` 切换到更粗的一层刻度；
向上滚 = 拉近（视窗跨度变小），到阈值 `0.125` 切换到更细的一层。
视窗中心始终被夹在 `[跨度, 1-跨度]` 内，越界就把整个视窗挪一格。

### 展开树：基本列的逐层展开

`expansionTree` 是一条 `LinkedList`，初始只有 `Limit` 和 `0` 两行。
点击某个极限序数行，就在它和下一行之间插入「首超项」；
勾选「展开树连续展开」则一路展开到底。每行带 4 个整数用于缩进，
设置页的四种对齐模式（全部 / 基本序列 / 连续展开 / Hyp Cos）决定用哪一个。

---

## 五、还原时做的取舍

1. **标识符全部英文化**，注释保留中文（注释里出现的标识符也一并改成英文）。
2. **事件绑定**：反编译产物里事件是用属性 setter + `+=` 挂上去的，
   这正是 VB `WithEvents / Handles` 编译后的样子，因此改回 `Handles`（保持原行为）。
3. **按值传递**：原程序大量使用 `ByRef`（反编译成 `ref`），
   但很多参数从未被修改。对确实需要回写的（如 `ValidateExpression`）保留 `ByRef`，
   其余保持原样以尽量贴近原语义。
4. **结构体赋值**：VB 不允许直接给"属性返回的结构体的字段"赋值，
   展开树里改用局部副本操作（因为 `Levels` 是数组、引用共享，行为完全等价）。
5. **删除死代码**：两个从未使用的 `TreeNode` 字段。
6. **未恢复的东西**：局部变量名、注释、代码格式、原始工程结构——这些在混淆时已永久丢失；
   控件名保持了原样（作者没改过设计器默认名，`Button1`、`TextBox1`……）。

---

## 六、原程序中疑似 bug（保留原样，未修改）

代码中用 `★` 标出：

1. **`TreeClick` 的 `Levels(0)`**：首次展开时写入的是一个**像素坐标**（`targetY`），
   而不是"已展开到第几项"。于是同一行第二次点击会走"再次展开"分支，
   把这个像素值当作基本列下标继续 `+1`（通常会得到一个离谱的展开结果）。
   看起来应该是想写 `-1` 之外的某个计数初值。
2. **`rootNode.Adjacent` 只有 4 个元素**（下标 0~3，无同层邻居），
   而其它节点都是 6 个。滚轮拉远的某条分支理论上会访问 `rootNode.Adjacent(4)` / `(5)`
   而越界；实际运行时被 `upperNode Is rootNode.Adjacent(3)` 这个判断挡住了大部分路径。
3. **`ValidateExpression` 里重启引擎**：直接对已在运行的进程调用 `Start()` 会抛异常，
   原程序没有 try/catch 包裹（只有 `Form1_Closed` 里的 `CloseMainWindow` 有）。

---

## 七、编译

* 目标框架：**.NET Framework 4.x**（用到 `Microsoft.VisualBasic.FileSystem.FileOpen/Input/Print`、
  `Collection`、`MyBase.Closed`）
* 项目类型：Windows 窗体应用程序
* 启动对象：设为 **`Sub Main`**（入口是 `Form1.Main`，不是默认窗体）
* 引用：`System`、`System.Drawing`、`System.Windows.Forms`、`Microsoft.VisualBasic`
* 两个文件必须放在同一个项目里（`Form1.vb` + `Form1.Designer.vb` 同为 `Partial Class Form1`）

> 如果不用 `Sub Main` 而启用"应用程序框架"，就把 `Main` 删掉、
> 把启动窗体设为 `Form1`，效果一样。

---

## 八、配置文件格式

启动目录下的隐藏文件 **`1`**（`FileAttributes.Hidden`）：

```
6                        ← 版本号
<n-1>                    ← 记号引擎个数 - 1
<插件路径 × n>            ← 每行一个
<记号名称 × n>            ← 每行一个
<R><G><B> × 3            ← 三个颜色（无换行分隔）
<1|2|3|4>                ← 对齐模式：全部 / 基本序列 / 连续展开 / Hyp Cos
<True/False>             ← 展开树连续展开
<True/False>             ← 序数尺密集刻度
```

---

## 九、写一个自己的 ONP2 插件

只要是个控制台程序，遵守下面两条就能被这个界面加载：

1. 启动后**立刻输出两行**到 stdout：
   ```
   Ordinal Notation Protocol 2
   <你的记号系统名称>
   ```
2. 之后进入循环：从 stdin 读命令（命令号 + `\r\n` 分隔的参数），向 stdout 写一行结果。
   * `"1\r\n<a>"` → Limit 的基本列第 a 项
   * `"2\r\n<a>"` → `"1"` / `"2"` / `"3"`
   * `"3\r\n<a>"` → a 的前继序数
   * `"4\r\n<a>\r\n<b>"` → b 的基本列第 a 项
   * `"5\r\n<a>\r\n<b>"` → `"2"`（a<b）或 `"1"`（a≥b）
   * 结果为 0 时输出 `"0"`

注意主程序每次只 `ReadLine()` 一行，所以**每条命令必须恰好输出一行、并且及时 flush**。

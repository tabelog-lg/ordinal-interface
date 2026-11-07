# 原 VB.NET 项目说明（序数界面1 v1.5.4 还原版）

> **关于本文档**
> 这是**原 Windows 桌面版项目**的 README，讲的是 VB.NET 工程的目录结构与编译方式。
> 本仓库是它的网页前端移植版，主说明见根目录的 [README.md](../README.md) / [README_EN.md](../README_EN.md)。
> 原文件名为 `README.md`，收入本仓库时重命名，以免与网页版的 README 冲突。
>
> 文中提到的 `.vb` 源码未收入本仓库（网页版已用 TypeScript 重写），
> 需要对照源码时请回到原还原项目。

---

# Ordinal Interface 1 —— 序数界面1 v1.5.4（还原版）

由反编译产物 `Form1.cs` 还原出来的完整 VB.NET WinForms 项目。
程序本体不做序数运算，真正的记号系统由外部「序数记号」控制台插件提供，
二者通过 **ONP2（Ordinal Notation Protocol 2）** 协议通信。

---

## 一、目录结构

```
OrdinalInterface/
├─ OrdinalInterface.vbproj           主项目（.NET Framework 4.8，WinForms）
├─ OrdinalInterface.vb               主窗体逻辑（英文标识符 + 中文注释）
├─ OrdinalInterface.Designer.vb      窗体设计器代码（控件布局）
├─ My Project\AssemblyInfo.vb        程序集信息
├─ ONP2-protocol-and-restoration.md  协议原文、混淆名对照表、还原笔记（原中文名已 ASCII 化）
├─ README.md                         本文件
└─ examples\
   └─ Omega2Notation\                示例插件：ω² 以下的序数记号
      ├─ Omega2Notation.vbproj
      └─ Program.vb
```

> 窗体类名已从反编译产物的 `Form1` 改为 `OrdinalInterface`；
> 控件名（`Button1`、`TextBox1`……）沿用原程序，未重命名。

---

## 二、编译

### 用 Visual Studio（推荐）

双击 `OrdinalInterface.vbproj` 即可打开（VS 2015 ~ 2022 均可），按 F5 生成并运行。

### 用命令行 MSBuild

```bat
msbuild OrdinalInterface.vbproj /p:Configuration=Release
```
产物在 `bin\Release\OrdinalInterface.exe`。

### 用 dotnet build

`dotnet build` **不支持**这种传统格式的 `.vbproj`。若要使用它，请新建 SDK 风格项目：

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net48</TargetFramework>
    <UseWindowsForms>true</UseWindowsForms>
    <MyType>Empty</MyType>
    <StartupObject>OrdinalInterfaceApp.OrdinalInterface</StartupObject>
    <RootNamespace>OrdinalInterfaceApp</RootNamespace>
    <OptionStrict>Off</OptionStrict>
  </PropertyGroup>
</Project>
```
（SDK 风格项目会自动包含目录下所有 `.vb`，不要再手工列 `Compile` 项。）

### 依赖

只需 .NET Framework 4.8，无任何 NuGet 包。
用到的引用：`System`、`System.Drawing`、`System.Windows.Forms`、`Microsoft.VisualBasic`。

---

## 三、跑起来之后怎么用

1. 先编译并运行示例插件：
   ```
   msbuild examples\Omega2Notation\Omega2Notation.vbproj /p:Configuration=Release
   ```
   得到 `examples\Omega2Notation\bin\Release\Omega2Notation.exe`。
2. 打开序数界面 → **选择序数记号** 页 → 点「添加序数记号位置」→ 选上面的 exe。
   握手成功的话，列表里会出现记号名称 `Omega2 (w^2)`。
3. 选中它，界面会自动启动常驻引擎，然后：
   * **序数尺** 页：滚轮缩放，可以沿着 0 → 1 → … → ω → ω·2 → … → ω² 一直放大。
   * **展开树** 页：点 `Limit` 那一行，展开出 ω、ω·2 ……；滚轮上下滚。
   * **杂项** 页：展开序数 / 返回序数类型 / 大小比较 / 返回前继序数。
     （例如 TextBox1 填 `Limit`、TextBox2 填 `5`，点「展开序数」，得到 `w*5`。）
   * **设置** 页：改配色、展开树的对齐模式、是否密集刻度 / 连续展开。

配置（插件列表、颜色、对齐模式）会写进**程序目录下的隐藏文件 `1`**，下次启动自动恢复。

---

## 四、ONP2 协议速查

插件启动后立刻输出两行：

```
Ordinal Notation Protocol 2
<记号系统名称>
```

之后逐行读命令、逐行回结果：

| 命令 | 收到的行 | 要回答 |
|---|---|---|
| 1 | `"1"`、`a` | Limit（该系统的最大序数）的基本列第 a 项 |
| 2 | `"2"`、`a` | `"1"`（a=0）/ `"2"`（后继序数）/ `"3"`（极限序数） |
| 3 | `"3"`、`a` | a 的前继序数 |
| 4 | `"4"`、`a`、`b` | b 的基本列第 a 项 |
| 5 | `"5"`、`a`、`b` | a<b → `"2"`；否则 → `"1"` |

结果为 0 时回答字符串 `"0"`。完整条文与逐条核对见 `ONP2-protocol-and-restoration.md`。

---

## 五、已知问题

以下几处是**原程序自带的**，还原时按原样保留（代码里用 `★` 标出）：

1. **展开树重复点击**：首次展开时写进 `Levels(0)` 的是一个像素坐标而不是展开计数，
   于是同一行第二次点击会把它当基本列下标继续 +1，得到离谱的结果。
2. **根节点邻接数组只有 4 个元素**（其它节点都是 6 个），滚轮拉远的某条分支
   理论上会越界；实际被 `upperNode Is rootNode.Adjacent(3)` 这个判断挡住了大部分路径。
3. **重启引擎的分支**：直接对已运行的 `Process` 调 `Start()` 会抛异常，原程序没有 try/catch。
4. **探测进程残留**：`Process.CloseMainWindow()` 对控制台插件多半无效，
   所以每次「添加记号 / 切换记号」启动的探测进程可能不会退出，需要手动结束。
   退出界面前建议先看一眼任务管理器。

---

## 六、想看还原细节？

`ONP2-protocol-and-restoration.md` 里有：

* 官方协议原文，以及与逆向结果的**逐条核对表**；
* 混淆名 → 还原名的完整对照（`Class1` → `RulerNode`、`Sub3` → `CreateChild` ……）；
* 序数尺 / 展开树两个核心算法的说明；
* 配置文件的字节级格式；
* 自己动手写一个 ONP2 插件的最小清单。

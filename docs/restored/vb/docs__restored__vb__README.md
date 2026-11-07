# 还原出的 VB.NET 源码

放在这里的就是**这次网页版移植所依据的原始 VB 工程**，目录结构已按原项目复原。

```
docs/restored/vb/
├─ OrdinalInterface.vbproj            主项目（.NET Framework 4.8，WinForms）
├─ OrdinalInterface.vb                主窗体逻辑（英文标识符 + 中文注释，1157 行）
├─ OrdinalInterface.Designer.vb       窗体设计器代码（控件布局，542 行）
├─ My Project\AssemblyInfo.vb         程序集信息
├─ examples\
│  └─ Omega2Notation\                 示例插件：ω² 以下的序数记号
│     ├─ Omega2Notation.vbproj
│     └─ Program.vb
└─ README.md                          本文件
```

## 这些文件是怎么来的

- 原始材料是反编译产物 `Form1.cs`（混淆过的 C#，标识符全部退化成 `Class1` / `Sub1` / `Dim1`……）；
- 还原时把标识符按语义重新命名成英文，补上中文注释，事件绑定改回 VB 原生的
  `WithEvents` / `Handles`，窗体类名由 `Form1` 改为 `OrdinalInterface`；
- 控件名（`Button1`、`TextBox1`……）沿用原程序未重命名，方便与 Designer 对照；
- `My Project\AssemblyInfo.vb` 在原项目里就位于子目录下，这里照原样保留。

**编译相关的两个 `.vbproj` 未作任何修改**，可以直接用 Visual Studio 打开或 `msbuild` 构建。

## 编译

```bat
msbuild OrdinalInterface.vbproj /p:Configuration=Release
```
产物在 `bin\Release\OrdinalInterface.exe`。用 Visual Studio 打开 `.vbproj` 按 F5 也可以
（VS 2015 ~ 2022 均可）。`dotnet build` 不支持这种传统格式的 `.vbproj`，需要改用 SDK 风格项目。

> `.vbproj` 里有两条 `<None Include="ONP2-protocol-and-restoration.md" />` 和
> `<None Include="README.md" />`。原工程写的是中文文件名，入库时按仓库约定统一 ASCII 化；
> 这两条只是「随项目附带的说明文件」列表项，不参与编译。
> 这两份文档在本仓库里放在**上一层**（[`docs/`](../../README.md)），不在本目录。
> `None` 项只是给 IDE 显示用的、不参与编译，所以缺它们不影响构建；
> 想让解决方案资源管理器里不显示警告，把那两个文件复制进来即可。

## 与网页版的对应关系

- `OrdinalInterface.vb` 里的协议通信部分 → `src/engine/host.ts`
- 序数尺状态机（`DrawRuler` / `DrawTicks` / `CreateChild` / `CreateSibling`）→ `src/core/ruler.ts`
- 展开树状态机（`DrawTree` / `TreeClick`）→ `src/core/tree.ts`
- `examples\Omega2Notation\Program.vb` → `src/engine/omega2.ts`

**逐行对照用的标识符映射表**（混淆名 → 还原名 → 网页版落点）见 [`docs/README.md`](../../README.md)。
那份表里也列出了原程序三个已知 bug 的修复位置。

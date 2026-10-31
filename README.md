# 序数界面1 v1.5.4 —— 网页前端版

> 大可数序数记号的可视化浏览器，从 .NET Framework 4.8 WinForms 移植到浏览器。

原程序是中文 googology（大数）社区的一个桌面工具：**主程序自己不做任何序数运算**，
真正的记号系统由外部「序数记号」插件提供，两者通过 **ONP2（Ordinal Notation Protocol 2）** 通信。
这个网页版完整保留了该设计，只是把插件形态从「控制台 exe + stdin/stdout」换成了「JS 模块 + 同步函数调用」。

🔗 **在线体验**：`https://tabelog-lg.github.io/ordinal-interface/`（GitHub Actions 首次跑完后生效）
　 自检页：`https://tabelog-lg.github.io/ordinal-interface/selftest.html`

---

## 一、它长什么样

五个页签，与原程序一一对应：

| 页签 | 作用 |
|---|---|
| **选择序数记号** | 列出可用记号系统，可添加 / 删除插件 |
| **杂项** | 展开序数 · 返回序数类型 · 大小比较 · 返回前继序数 |
| **展开树** | 点击极限序数行逐层展开基本列，滚轮上下滚 |
| **序数尺** | 滚轮缩放，沿 0 → 1 → … → ω → ω·2 → … → ω² 一直放大 |
| **设置** | 配色、对齐模式、密集刻度 / 连续展开、配置导入导出 |

内置记号 `Omega2 (w^2)` 由 `examples/Omega2Notation/Program.vb` 逐行移植而来，
表达式写法是纯 ASCII 的：`0` `5` `w` `w*3` `w*3+7` `Limit`（= ω²）。

界面文案沿用原程序原文：表达式不正确 / 序号不正确 / 表达式不是极限序数 /
表达式不是后继序数 / 极限序数 / 后继序数。

---

## 二、本地跑起来

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 产出到 dist/（先跑 TypeScript 类型检查）
npm run preview  # 预览构建产物
```

> `dist/` 用了 ES module，**不能用 `file://` 直接打开**，必须走 HTTP：
> `cd dist && python3 -m http.server 8000`

## 三、部署

仓库里已带 `.github/workflows/deploy.yml`，推到 `main` 会自动构建并发布到 GitHub Pages。

`vite.config.ts` 里 `base: './'`，资源路径全是相对的，所以发布在
`https://xxx.github.io/<仓库名>/` 这种子路径下也能正常工作 —— **改仓库名不需要动配置**。

```bash
npx esbuild tests/verify.ts --bundle --platform=node --format=esm --outfile=/tmp/verify.mjs
node /tmp/verify.mjs
```

45 项断言，覆盖五个协议命令、表达式解析/格式化、`Limit` 与 `0` 的短路、表达式校验、
序数尺初始化与连续缩放（含拉远到最顶层的越界路径、反复横跳）、
展开树点击展开（含 bug 1 修复点）、滚动。

另有一个**浏览器内自检** `selftest.html`（开发用）：用真实 canvas 验证"确实画出了像素"，
打开后结果直接打印在页面上，页面标题会变成 `SELFTEST-PASS` / `SELFTEST-FAIL`。

---

## 四、目录结构

```
src/
├─ main.ts                入口：页签切换、引擎装载
├─ style.css
├─ engine/
│  ├─ types.ts            ONP2 协议定义（命令 1~5）
│  ├─ omega2.ts           ω² 记号，由 Program.vb 逐行移植
│  ├─ host.ts             引擎宿主：六个动作 + 结果缓存
│  └─ plugins.ts          插件仓库（内置 + 用户上传，源码存 IndexedDB）
├─ core/
│  ├─ dlist.ts            最小双向链表
│  ├─ ruler.ts            序数尺状态机（二分细分树 + 同层链表）
│  ├─ tree.ts             展开树状态机
│  └─ state.ts            全局设置 + 持久化
└─ ui/
   ├─ dom.ts              canvas 高清适配、滚轮归一化
   ├─ rulerView.ts        序数尺绘制
   ├─ treeView.ts         展开树绘制
   ├─ misc.ts             杂项页
   ├─ settings.ts         设置页
   └─ plugins.ts          记号列表页
tests/verify.ts            逻辑自检（不依赖 DOM）
public/plugins/            插件模板
```

**分层原则**：`core/` 是纯状态机（不知道 DOM 的存在，引擎宿主可注入，方便单独测）；
`ui/` 只管画和收事件。所以 `tests/verify.ts` 能在 node 里跑完所有核心逻辑。

---

## 五、写一个自己的记号插件

插件是一个**自包含的 ES module**（不要 import 其它本地文件），默认导出实现 ONP2 五个方法的对象：

```js
export default {
  name: 'My Notation',

  // 命令 1：最大序数 Limit 的基本列第 a 项
  fsLimit(a) { return /* ... */ },
  // 命令 2：序数类型 —— "1"=0 / "2"=后继序数 / "3"=极限序数
  typeOf(a)  { return /* ... */ },
  // 命令 3：前继序数（极限序数与 0 返回 "0" 兜底）
  pred(a)    { return /* ... */ },
  // 命令 4：序数 b 的基本列第 a 项
  fs(a, b)   { return /* ... */ },
  // 命令 5：a < b ?
  less(a, b) { return /* ... */ },
};
```

协议要点：

- 五个方法必须是**纯函数**——宿主会按输入缓存结果。`FirstExceeding` 是线性递增扫描，
  一次可能发几十次查询，滚轮连滚会放大成上百次，没有缓存会明显卡。
- 宿主会对 `Limit`（恒为极限序数、恒大于任何序数）和 `0`（恒为最小）做短路，
  但插件自己**仍应正确处理这两者**，因为命令 1、4 会把它们真的传进来。
- 结果为 0 时一律返回字符串 `"0"`。

点「下载插件模板」可拿到一份骨架；`public/plugins/omega2-example.js` 是完整可跑的参考实现。

---

## 六、与原程序的差异

### 架构上必须改的

| 原程序 | 网页版 |
|---|---|
| 插件是本地控制台 exe，stdin/stdout 逐行对话 | 插件是 JS 模块，同步函数调用 |
| 配置写在启动目录下的隐藏文件「1」 | localStorage + JSON（可导出，也能导入旧档） |
| 存插件 exe 的绝对路径 | 存插件 id，源码存 IndexedDB |
| `OpenFileDialog` / `ColorDialog` | `<input type="file">` / `<input type="color">` |
| `Timer1` + `TopMost`（防控制台窗口抢焦点） | 删除，网页里没有意义 |
| `probeProcess`（握手校验、进程残留） | 删除，改为读插件的 `name` |

### BUG 修复（原 README 第六节）

1. **展开树重复点击**：原程序把**像素坐标**写进 `Levels(0)`，同一行第二次点击会把它当基本列
   下标继续 `+1`，得到离谱结果。现在写入的是 `FirstExceeding` 真正用到的基本列下标，
   于是第二次点击正好取到基本列的下一项（实测 ω → ω·2）。
2. **根节点邻接数组只有 4 个槽位**（其它节点 6 个）：拉远的某条分支会越界，而两个边界节点
   （`"0"` / `"Limit"`）的邻接干脆是 `Nothing`。现在统一成 6 槽，并让 `CreateChild` /
   `CreateSibling` 在"生不出来"时返回失败而不是崩溃，调用方据此把视窗夹回边界。
3. **`ValidateExpression` 靠 `engineProcess.Responding` 判断卡死**，并在此时对已运行的进程
   调 `Start()`（会抛异常且无 try/catch）。现在改用**迭代上限**兜底——这个循环本身存在
   死循环路径，没有上限的话插件一有偏差整个页面就冻结。

### 网页版新增的健壮性改进

- **空节点保护**：序数尺往"上"放大时，`CreateChild` 生成的子节点可能是空的
  （例如 ω 与 ω+1 之间**根本不存在任何序数**，这是记号本身的性质，不是移植错误）。
  原程序会无条件移过去，导致半屏突然空白；现在遇到空节点就停在最后一个有效刻度。
- **IndexedDB 超时兜底**：个别环境里（隐私模式、嵌入 WebView、无用户交互的自动化场景）
  IndexedDB 会一直 pending，而启动流程是 `await restorePlugins()`，挂住就白屏。
  加了 3 秒超时，超时就当"没有用户插件"，应用照常启动。
- **滚轮归一化**：不同浏览器 / 设备的 `deltaY` 量级差异极大，统一折算成像素后
  按「每 100px = 一格」触发，约等于 WinForms 里滚一格（`e.Delta = ±120`）。
- **高清屏适配**：原程序开一张「主屏分辨率大小」的 Bitmap 再 1:1 显示，不做 DPI 缩放。
  网页版按 `devicePixelRatio` 放大 backing store 再 CSS 缩回，
  刻度线画 **1 个物理像素**（对应原程序的 1 像素），高分屏上才不会糊。

### 布局

原 Designer 里所有容器尺寸都是 `120, 0` 这类占位值（反编译产物丢失），
只有按钮 51px、TextBox 48px、ItemHeight 41 这些相对线索可参考，
所以网页版重新定了一套布局，行高走 CSS 变量 `--row-h`（默认 43px）。

---

## 七、已知限制

- **用户上传的插件只在当前浏览器有效**：源码存在 IndexedDB 里，换台机器 / 换个浏览器要重新添加。
  内置记号 `Omega2 (w^2)` 不受此限制。
- **旧版配置文件只能部分导入**：颜色、对齐模式、两个开关能恢复，
  其中的插件 exe 路径在浏览器里无法复原（拿不到真实路径，也执行不了 exe）。
- **序数尺在 ω² 记号下放大空间有限**：这个记号系统只到 ω²，
  放大到 ω 附近会遇到大量"中间不存在序数"的空档。要一路放大到 ε₀、Γ₀，
  需要换一个更强的记号插件。

---

## 八、致谢与来源

- 原程序：序数界面1 v1.5.4（中文 googology 社区）
- 移植依据：反编译产物 `Form1.cs` 还原出的 `OrdinalInterface.vb` / `OrdinalInterface.Designer.vb`
- 协议：《ONP2协议与还原说明.md》所载官方条文
- 内置记号：`examples/Omega2Notation/Program.vb`

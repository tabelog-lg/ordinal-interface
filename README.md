# 序数界面1 v1.5.4 —— 网页前端版

> 大可数序数记号的可视化浏览器，从 .NET Framework 4.8 WinForms 移植到浏览器。

**简体中文** | [English](./README_EN.md)

原程序是中文 googology（大数）社区的一个桌面工具：**主程序自己不做任何序数运算**，
真正的记号系统由外部「序数记号」插件提供，两者通过 **ONP2（Ordinal Notation Protocol 2）** 通信。
这个网页版完整保留了该设计，只是把插件形态从「控制台 exe + stdin/stdout」换成了「JS 模块 + 同步函数调用」。

🔗 **在线体验**：`https://tabelog-lg.github.io/ordinal-interface/`
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

内置 **32 个**记号。前两个由原项目的 VB 示例逐行移植，后 30 个由 ONP2 exe 的
反编译产物复原（见 `docs/restored/`）：

| 记号 | 覆盖范围 / 来源 | 表达式示例 |
|---|---|---|
| `Omega2 (w^2)` | ω² 以下，由 `examples/Omega2Notation/Program.vb` 逐行移植 | `0` `5` `w` `w*3` `w*3+7` `Limit`（= ω²） |
| `OmegaOmega (w^w)` | ω^ω 以下，形如 Σ c[i]·ω^i | `w^2` `w^2*3+w*2+5` `w^3+w` `Limit`（= ω^ω） |
| 30 个复原记号 | Bashicu 矩阵系 / Y 序列系 / PrSS 系 / PPS 系等 | `(0,0)(1,1)(2,2)` `1,2,3` `(()())` `0(1(2()))` |

表达式写法由各记号自己决定（矩阵、逗号序列、括号串、空格序列都有），
不统一 —— 换记号时旧的表达式串一般不再适用。

> 复原记号对齐的是 **ONP2 exe 的输出口径**，不是逐字对齐 Googology Wiki 定义：
> `fs(n)` 在 0-Y / BMS / LPrSS / KP Hydra / PSS Hydra 上比定义多一块、
> `less` 采用字典序、LELS 按原作者 C++ 源码复原。已按 11 份实现审查报告修掉
> 输入层、协议短路与死循环护栏，并统一 `fsLimit` 为 0-based。
> 完整口径与「为什么不改那几处」见 [`docs/IMPLEMENTATION-NOTES.md`](docs/IMPLEMENTATION-NOTES.md)。

列表里第一项是默认记号；想改默认就调 `src/engine/plugins.ts` 里 `BUILTINS` 数组的顺序。

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

## 四、验证

```bash
npm run verify   # 逻辑自检
npm run bench             # 性能基准：2 个内置记号 + 引擎组合
npm run bench:notations   # 性能基准：全部 30 个复原记号（独立子进程）
```

约 200 项断言，覆盖五个协议命令、表达式解析/格式化、`Limit` 与 `0` 的短路、表达式校验、
序数尺初始化与连续缩放（含拉远到最顶层的越界路径、反复横跳）、
展开树点击展开（含 bug 1 修复点）、滚动，
以及二分查找与暴力线性扫描的**交叉验证**（45 个用例）和缓存的容量上限。

另有一个**浏览器内自检** `selftest.html`（开发用）：用真实 canvas 验证"确实画出了像素"，
打开后结果直接打印在页面上，页面标题会变成 `SELFTEST-PASS` / `SELFTEST-FAIL`。

---

## 五、目录结构

```
src/
├─ main.ts                入口：页签切换、引擎装载
├─ vite-env.d.ts          CSS 导入的类型声明（tsc 认不了 vite 的 import './style.css'）
├─ style.css
├─ engine/
│  ├─ types.ts            ONP2 协议定义（命令 1~5）
│  ├─ omega2.ts           ω² 记号，由 Program.vb 逐行移植
│  ├─ omegaOmega.ts       ω^ω 记号（第二个内置记号）
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
└─ notations/             ★ 30 个复原记号（ONP2 插件形态）
   ├─ index.ts            注册表
   ├─ core/               共通框架：seq / matrix / bms / vb
   └─ {30 个记号}.ts
tests/
├─ verify.ts              逻辑自检（不依赖 DOM）
├─ verify_notations.mjs    ★ 记号插件回归（99 条：修正项 + PPS4 替换 + 契约锁定 + 性能快照）
├─ bench_notations.mjs     ★ 全 30 记号测速（npm run bench:notations）
├─ integration.mjs        把 30 个记号塞进宿主 / 序数尺 / 展开树跑一遍
├─ integration2.mjs       查每个记号命令 1（基本列）的形态
├─ i3.mjs                 查给定表达式后展开是否严格递增
└─ check_names.mjs        断言：plugins.ts 的名字表与记号实现一致
tools/
└─ crosscheck.py           ★ 对拍：TS 记号 ⇄ 26 个 ONP2 exe（说明见 docs/crosscheck.md）
docs/                         ★ 全部文档的总导航见 docs/README.md
├─ README.md                       文档总导航 + VB 标识符对照 + 已修 bug
├─ CHANGELOG.md                    ★ 变更记录：每轮改了哪些文件、资料来源
├─ ONP2-protocol-and-restoration.md 协议条文、复原说明
├─ original-vb-project.md           原项目说明
├─ IMPLEMENTATION-NOTES.md         ★ 实现基准、修正清单、明确不改的偏移与理由
├─ pps4-v2.md                      PPS4 当前实现基准（原 v2，旧版已删除）
├─ crosscheck.md                   ★ 对拍工具用法、26 exe 映射、报告判读
├─ performance.md                  ★ 性能评估与优化落地记录（含 A/B 组取舍）
├─ bench-baseline.json             落地前后全 30 记号测速原始数据
├─ reviews/                        ★ 11 份实现审查报告 + 基准原文 + 差分数据
│  ├─ README.md                     索引与「报告↔本轮修正」对应表
│  ├─ audit-*.md                  11 份审查 / 源码对照报告
│  ├─ audit-reference-materials.md / audit-diff-details.txt / audit-crosscheck-summary.json
├─ pps4-v2-changes/                ★ PPS4 替换的历史归档（11/7 快照，原包全量）
│  ├─ README.md / STATUS.md（当前状态）/ 01-reversed-diff.md / 02-behavior-diff.txt
│  ├─ 03-txar-fix.md / 04-file-manifest.md / diagnostics-*.txt
│  └─ scripts/、changed-files/
├─ process-artifacts/              ★ 过程性资料总索引（4 份原件 + 清单）
│  ├─ README.md / temp-files.md / diagnostics-rebuilt.md
│  └─ pps4-v2-temp.md / workspace-extras.md
└─ restored/                        ★ 复原产物（移植依据，不进 dist）
   ├─ README.md
   ├─ cpp/                30 个记号的 C++ 复原版（make 可构建）
   ├─ csharp/             第二批 3 个记号的 VB.NET/C# 复原版
   ├─ lels-original-source/  LELS 原始 C++ 源码
   └─ vb/                 还原出的完整 VB.NET 工程
public/plugins/            插件模板
```

**分层原则**：`core/` 是纯状态机（不知道 DOM 的存在，引擎宿主可注入，方便单独测）；
`ui/` 只管画和收事件。所以 `tests/verify.ts` 能在 node 里跑完所有核心逻辑。

---

## 六、写一个自己的记号插件

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

点「下载插件模板」可拿到一份骨架；`public/plugins/omega2-example.js` 是完整可跑的参考实现，
`src/engine/omega2.ts` 与 `src/engine/omegaOmega.ts` 两个内置记号则是更完整的范本。

**新增一个内置记号**只需两步：在 `src/engine/`（或 `src/notations/`）下写好实现，
然后往 `src/engine/plugins.ts` 的 `BUILTINS` 数组里加一行
`{ id: 'builtin:xxx', name: '...', load: ... }`。
UI、列表渲染、默认选中逻辑都是通用的，不用再改别处。

> `name` 是后来加的字段。原先启动时为了拿名字要把每个内置记号都 `import` 一遍，
> 2 个时无所谓，32 个时等于把懒加载设计废掉（首屏拉下全部记号代码）。
> 改成表里写死名字后启动零 import —— 代价是名字要维护两份，
> `tests/check_names.mjs` 有断言兜底。

---

## 七、与原程序的差异

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

---

## 八、性能

移植时做过一轮针对性优化。改动前用 `npm run bench` 量过，**先定位再动手** ——
实测下来真正的瓶颈只有一个：`FirstExceeding` 的线性扫描。

> **2026-11-08 追加一轮**：`npm run bench` 只覆盖 2 个内置记号，本轮补了
> `npm run bench:notations`（全部 30 个复原记号），落地 5 项纯内部优化与
> 展开树连续展开的 OOM 护栏，`fs` 1.60× / `less` 1.47× / `firstExceeding` 1.37×，
> 全量输出快照逐字不变。详见 [`docs/performance.md`](./docs/performance.md)。

### 两个算法层面的优化

**1. `FirstExceeding` 线性扫描 → 指数搜索 + 二分（O(n) → O(log n)）**

这个函数在基本列里找第一个超过目标的项，是序数尺细分的核心，滚轮每滚一格都要跑。
谓词 `a < FS[i]` 对 `i` 单调（因为基本列严格递增），所以可以二分：

| 用例 | 优化前 | 优化后 | 提升 |
|---|---|---|---|
| `firstExceeding("w*500","Limit")` ×1000 | 82.17 ms | 4.83 ms | **17×** |
| `firstExceeding("w*5000","Limit")` ×1000 | 1197.60 ms | 7.87 ms | **152×** |

关键是**不再随 n 线性增长**——原来 n 翻 10 倍耗时翻 10 倍，现在基本是常数级。
这也让内置 ε₀、Γ₀ 这类强记号变得可行（原来那样一定会卡）。

安全兜底做了两件事：指数搜索有上限（插件基本列不递增时约 20 次翻倍就越界报错，
不会像线性扫描那样先卡死 100 万次查询）；二分结束后再花一次查询验证前一项不超过目标。
**正确性有交叉验证兜底**：`tests/verify.ts` 里拿暴力线性扫描做对照，
在 45 个用例（含所有 2 的幂次边界）上比对结果，全部一致。

**2. `ValidateExpression` 结果缓存**

非法串要走完整条逼近链（实测 0.5 ms/次），杂项页反复点同一个表达式会反复付这个代价。
加缓存后重复调用从 982 ms/2000 次降到 **0.10 ms**（约 1 万倍）。

### 渲染层面

- **重绘走 `requestAnimationFrame` 合并**：滚轮连滚、拖窗口、设置页拖颜色时，
  一帧内无论触发多少次都只画一次。
- **消除强制同步布局（forced reflow）**：`getComputedStyle` / `getBoundingClientRect`
  这类会强制浏览器同步计算布局的调用，原本在每帧绘制路径和滚轮循环里被反复调用
  （`--row-h` 甚至每次访问都查一次）。现在字体家族、行高只在构造时读一次，
  鼠标坐标在滚轮循环外只算一次。
- **`fillStyle` 只在颜色真的变了才设**，避免逐行触发状态切换。

### 内存

所有查询结果缓存都有**容量上限**（5 万条，溢出按 FIFO 淘汰一批）。
序数尺能无限缩放、节点按需生成会持续产生新的查询 key，没有上限内存会一直涨。
切换记号时缓存整体清空，避免两套记号的结果串味。

> 缓存刻意**不做 LRU**：命中时挪 key 到末尾需要 delete + set 两次 Map 操作，
> 实测让缓存命中从 0.9 ms/万次涨到 5.5 ms/万次。纯 FIFO 的 `get` 是一次 `Map.get`、零开销，
> 代价是热数据也可能被挤掉，但它下次查询会重新填回来，影响远小于常驻开销。

## 九、已知限制

- **用户上传的插件只在当前浏览器有效**：源码存在 IndexedDB 里，换台机器 / 换个浏览器要重新添加。
  内置记号 `Omega2 (w^2)` 不受此限制。
- **旧版配置文件只能部分导入**：颜色、对齐模式、两个开关能恢复，
  其中的插件 exe 路径在浏览器里无法复原（拿不到真实路径，也执行不了 exe）。
- **序数尺能放大多深取决于记号系统本身**：ω² 只到 ω²，ω^ω 只到 ω^ω，
  放大到接近上界时会遇到大量"中间不存在序数"的空档（这是序数的性质，不是 bug）。
  想一路放大到 ε₀、Γ₀，需要再写一个更强的记号插件。
  注意换到更强记号后，`FirstExceeding` 的线性扫描会成为瓶颈，详见「写一个自己的记号插件」。

---

## 十、文档导航

全部文档收在 [`docs/`](./docs/README.md) 下，**总导航与分组说明见 [`docs/README.md`](./docs/README.md)**。
按用途分八组：

| 组 | 内容 | 入口 |
|---|---|---|
| 实现基准与审查 | 11 份实现审查报告、基准原文逐字汇编、差分明细、26 记号 exe↔TS 对拍汇总 | [`docs/reviews/README.md`](./docs/reviews/README.md) |
| 本轮修正口径 | 改了什么、明确没改什么及理由、已知限制、复现命令 | [`docs/IMPLEMENTATION-NOTES.md`](./docs/IMPLEMENTATION-NOTES.md) |
| 变更归档 | PPS4 两版对照与替换的历史归档（当前实现见 [`pps4-v2.md`](./docs/pps4-v2.md)） | [`docs/pps4-v2-changes/README.md`](./docs/pps4-v2-changes/README.md) |
| 过程性资料 | 三个临时文件包的清单、反编译切片索引、已删除且无法恢复的文件 | [`docs/process-artifacts/README.md`](./docs/process-artifacts/README.md) |
| 移植依据 | 协议条文、原项目说明、VB 标识符对照、可编译的 C++/C#/VB 复原源码 | [`docs/ONP2-protocol-and-restoration.md`](./docs/ONP2-protocol-and-restoration.md)、[`docs/restored/README.md`](./docs/restored/README.md) |
| 对拍工具 | 26 个 exe ⇄ TS 记号逐条对拍、映射表、EOF 后不退出的进程模型、报告判读 | [`docs/crosscheck.md`](./docs/crosscheck.md) |
| 性能 | 全 30 记号测速、热点定位、A/B 组优化落地、展开树 OOM 护栏、基线数据 | [`docs/performance.md`](./docs/performance.md) |
| 变更记录 | 每轮改了哪些文件、资料来源、哪些过程产物未纳入 | [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) |

> **文件名约定**：仓库内所有文件名一律 ASCII（含交付 zip 条目）。
> 例外只有外部数据：`tools/crosscheck.py` 里 `EXE_MAP` 的值是你提供的 26 个原始
> exe 名（含中文/希腊字母），脚本按原名查找；审查报告与基准原文里记录的历史资料名同理。
> 原名 → 现名对照见 [`tools/README.md`](./tools/README.md)。

移植依据的两份主文档（**ASCII 文件名**，便于引用）：

- [`docs/ONP2-protocol-and-restoration.md`](./docs/ONP2-protocol-and-restoration.md) —— ONP2 协议官方条文与逆向核对表、
  混淆名 → 还原名对照、核心算法说明、配置文件字节级格式、插件编写清单
- [`docs/original-vb-project.md`](./docs/original-vb-project.md) —— 原桌面程序的 README（目录结构、编译方法、已知问题）

**VB 标识符 ↔ TypeScript 模块的对应关系表**见 [`docs/README.md`](./docs/README.md)。
还原出的原 VB 源码（`.vb` 工程）已收入 [`docs/restored/vb/`](./docs/restored/vb/)，保留原目录结构，
`.vbproj` 不用改就能直接构建。

> 2026-11-07 新增的审查文稿与修正文档记录的是**判定依据与取舍**，不是运行时依赖。
> 想知道「代码现在为什么是这样」，先读 `IMPLEMENTATION-NOTES.md`，再按
> `reviews/README.md` 查对应记号的报告；报告本身写的是修正前的状态。

## 十一、致谢与来源

- 原程序：序数界面1 v1.5.4（中文 googology 社区）
- 移植依据：反编译产物 `Form1.cs` 还原出的 `OrdinalInterface.vb` / `OrdinalInterface.Designer.vb`
- 协议：[`docs/ONP2-protocol-and-restoration.md`](./docs/ONP2-protocol-and-restoration.md) 所载官方条文
- 内置记号：原项目的 `examples/Omega2Notation/Program.vb`（已移植为 `src/engine/omega2.ts`）
- 30 个复原记号：用户提供的 exe 反编译产物、作者提供的 `LELS.cpp` 与
  `Parented BMS.cpp`；逐条对拍与审查记录见 [`docs/reviews/`](./docs/reviews/README.md)

# 序数界面1 v1.5.4 —— 网页前端版

由 `OrdinalInterface.vb` / `OrdinalInterface.Designer.vb`（.NET Framework 4.8 WinForms）移植而来。
五个页签、两套画布、一个可插拔的序数记号引擎，全部搬到了浏览器里。

程序本体**不做任何序数运算**——真正的记号系统由 ONP2 插件提供，这一点与原程序一致。

---

## 一、跑起来

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 产出到 dist/（含 TypeScript 类型检查）
npm run preview  # 预览构建产物
```

`dist/` 是纯静态文件，但用了 ES module，**不能用 `file://` 直接打开**，需要起一个静态服务器：

```bash
cd dist && python3 -m http.server 8000
```

## 二、怎么用

1. 打开后默认停在「选择序数记号」页，内置记号 `Omega2 (w^2)` 已自动装载。
2. **杂项**页：展开序数 / 返回序数类型 / 大小比较 / 返回前继序数。
   例如「极限序数」填 `Limit`、「序号」填 `5`，点「展开序数」得到 `w*5`。
3. **展开树**页：点 `Limit` 那一行展开出 ω、ω·2……；滚轮上下滚。
4. **序数尺**页：滚轮缩放，沿着 0 → 1 → … → ω → ω·2 → … → ω² 一直放大。
5. **设置**页：改配色、展开树的对齐模式、是否密集刻度 / 连续展开；可导出 / 导入配置。
   （旧版隐藏文件「1」也能导入，但其中的插件 exe 路径无法复原，只恢复颜色与开关。）

## 三、目录结构

```
src/
├─ main.ts                入口：页签切换、引擎装载
├─ style.css
├─ engine/
│  ├─ types.ts            ONP2 协议定义（命令 1~5）
│  ├─ omega2.ts           ω² 记号，由 examples/Omega2Notation/Program.vb 逐行移植
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
public/plugins/            插件模板，可下载后照着改
```

## 四、写一个自己的记号插件

插件形态从"控制台 exe"换成了**自包含的 ES module**（不要 import 其它本地文件）：

```js
export default {
  name: 'My Notation',
  fsLimit(a) { /* 命令 1：Limit 的基本列第 a 项 */ },
  typeOf(a)  { /* 命令 2："1"=0 / "2"=后继 / "3"=极限 */ },
  pred(a)    { /* 命令 3：前继序数 */ },
  fs(a, b)   { /* 命令 4：b 的基本列第 a 项 */ },
  less(a, b) { /* 命令 5：a < b ? */ },
};
```

五个方法必须是**纯函数**——宿主会按输入缓存结果（`FirstExceeding` 是线性扫描，
一次可能发几十次查询，没有缓存滚轮连滚会明显卡）。
点「下载插件模板」可以拿到一份骨架。

## 五、与原程序的差异

### 架构上必须改的

| 原程序 | 网页版 |
|---|---|
| 插件是本地控制台 exe，stdin/stdout 对话 | 插件是 JS 模块，同步函数调用 |
| 配置写在启动目录下的隐藏文件「1」 | localStorage + JSON（可导出，也能导入旧档） |
| 存插件 exe 的绝对路径 | 存插件 id，源码存 IndexedDB |
| `OpenFileDialog` / `ColorDialog` | `<input type="file">` / `<input type="color">` |
| `Timer1` + `TopMost`（防控制台抢焦点） | 删除，网页里没有意义 |
| `probeProcess`（握手校验 / 进程残留） | 删除，改为读插件的 `name` |

### BUG 修复（原 README 第六节）

1. **展开树重复点击**：原程序把**像素坐标**写进 `Levels(0)`，同一行第二次点击会把它当基本列
   下标继续 +1，得到离谱结果。现在写入的是 `FirstExceeding` 真正用到的基本列下标，
   于是第二次点击正好取到基本列的下一项。
2. **根节点邻接数组只有 4 个槽位**（其它节点 6 个）：拉远的某条分支会越界，
   而两个边界节点（"0" / "Limit"）的邻接干脆是 `Nothing`。现在统一成 6 槽，
   并让 `CreateChild` / `CreateSibling` 在"生不出来"时返回失败而不是崩溃，
   调用方据此把视窗夹回边界。
3. **`ValidateExpression` 靠 `engineProcess.Responding` 判断卡死**，并在此时对已运行的进程
   调 `Start()`（会抛异常且无 try/catch）。现在改用**迭代上限**兜底——这个循环本身存在
   死循环路径，没有上限的话插件一有偏差整个页面就冻结。

### 网页版新增的健壮性改进

- **空节点保护**：序数尺往"上"放大时，`CreateChild` 生成的子节点可能是空的
  （例如 ω 与 ω+1 之间**根本不存在任何序数**）。原程序会无条件移过去，导致半屏突然空白；
  现在遇到空节点就停在最后一个有效刻度。
- **IndexedDB 超时兜底**：个别环境里（隐私模式、嵌入 WebView）IndexedDB 会一直 pending，
  而启动流程是 `await restorePlugins()`，挂住就白屏。加了 3 秒超时，超时就当"没有用户插件"。
- **滚轮归一化**：不同浏览器 / 设备的 `deltaY` 量级差异极大，统一折算成像素后
  按「每 100px = 一格」触发，约等于 WinForms 里滚一格（`e.Delta = ±120`）。

## 六、验证

```bash
npx esbuild tests/verify.ts --bundle --platform=node --format=esm --outfile=/tmp/verify.mjs
node /tmp/verify.mjs
```

45 项断言，覆盖：五个协议命令、表达式解析/格式化、Limit 与 0 的短路、表达式校验、
序数尺初始化与连续缩放（含拉远到最顶层的越界路径、反复横跳）、
展开树点击展开（含 bug 1 修复点）、滚动。

另有一个浏览器内自检 `selftest.html`（开发用，不参与打包），
用真实 canvas 验证"确实画出了像素"。

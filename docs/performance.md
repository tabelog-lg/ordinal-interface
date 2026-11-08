# 性能评估与优化落地记录

> 2026-11-08 · 基于 `1f429127` 之后的一轮改动。
> **本轮所有改动都不改任何记号的输出**：全量输出快照逐字一致（回归组 D 锁定），
> 与序数尺 / 展开树 / `validate` 逼近链的组合行为经实测未变。
> 配套数据：[`bench-baseline.json`](./bench-baseline.json)，
> 工具：[`../tests/bench_notations.mjs`](../tests/bench_notations.mjs)。

---

## 一、原先的盲区

`tests/bench.ts`（`npm run bench`）只 import 了 `omega2` 与 `omegaOmega`
两个内置记号，测的是引擎缓存、`firstExceeding`、`validate`、序数尺、展开树。
`src/notations/` 下 **30 个复原记号一个都没进基准**，性能一直是盲区。

本轮新增 `npm run bench:notations`，覆盖全部 30 个记号 × 5 个协议原语
（直接打插件、绕开宿主缓存）+ `firstExceeding` / `validate`（每次新建
`EngineHost` 测冷路径）+ 序数尺 draw / wheel / 展开树 click。
每个记号独立子进程 + timeout + 堆上限，单个记号死循环或 OOM 不会拖死整轮。

---

## 二、实测热点（落地前，全 30 记号，ms/次）

| 分组 | `typeOf` | `less` | `pred` | `fs` | `firstExceeding` |
|---|---|---|---|---|---|
| 矩阵系 10 个 | 0.02425 | **0.05590** | 0.02775 | 0.04509 | **0.15948** |
| 其它 16 个 | 0.00318 | 0.00451 | 0.00149 | 0.02434 | 0.07151 |

矩阵系 `less` 比序列 / 括号系慢 **12 倍**。代码级原因：

1. `matrix.ts · matrixCompare()` —— 为每行做两次 `slice`（数千元素）、
   最多 300 行，还要 `concat(pad)` 复制两份缓冲；而 `less` 是
   `firstExceeding` 二分和 `validate` 逼近链里调用最频繁的原语。
2. `seq.ts · seqCompare()` / `seqCompare1()` —— 多分配一个 502 元素数组，
   把 `txar()` 结果整段复制进去再比较。
3. `notation.ts` —— 每次 `pred()` 长度为 1 时 `new Array(SEQMAX).fill(0)`；
   `fs()` 对**全部 30 个记号**都重置 500 个 `pm` 元素，而全仓库只有
   `zero_y` 与 `zero_y_super_non_lifting` 两个记号读 `pm`。
4. `matrix.ts · txma()` —— `s.split('')` + 反复 `indexOf` 是 O(n²)；
   `MatrixNotation.fs()` 先 `matrixType0()`（内部一次 `txma`）再 `txma()`，
   同一个串解析两遍。
5. `bms.ts · bmsPar()` / `bmsAsmt()` —— 每次 `new Array(301).fill(0)`。

**引擎层不用动**：`BoundedCache`、`firstExceeding` 的指数搜索 + 二分、
`validate` 的 GUARD 都是已有的优化。`host.ts` 注释里也记过实测——
缓存命中时改成 LRU 会让「万次查询」从 0.9ms 涨到 5.5ms，纯 FIFO 才对。

---

## 三、落地的改动

### A 组：纯内部优化

| # | 文件 | 改动 |
|---|---|---|
| A1 | `core/matrix.ts` | `matrixCompare` 去掉 `concat(pad)` 与每行两次 `slice`，改成在原数组上按偏移比 300 格（越界读按 0，与 pad 等价） |
| A2 | `core/seq.ts` | `seqCompare` / `seqCompare1` 去掉多余的 502 元素数组，`p[i] ?? 0` 直接比 |
| A3 | `core/notation.ts` + 2 个 `zero_y*.ts` | `pred()` 空序列返回 `[]`；`pm` 改成空数组 + `usePm` 开关，只有 2 个 0-Y 记号重置 500 元素 |
| A4 | `core/matrix.ts` + `core/notation.ts` | 新增 `matrixParse()`，一次解析同时给出 `m / rows / cols / typeCode`；`fs()` 合并原本的两遍解析 |
| A5 | `core/bms.ts` | 301 元素数组不再预填 0，未写位置按 `?? 0` 读（与 `fill(0)` 逐字等价） |

### B 组：试过之后落地 / 调整

| # | 结论 |
|---|---|
| **B6 `txma` 线性解析** | **落地**，但采用「快路径 + 回退」：`txmaFast()` 单游标扫描标准矩阵串 `(a,b,...)(c,d,...)...`；一旦出现嵌套括号、未闭合、非数字字符或尾部多余内容就返回 `null`，由 `txmaLegacy()`（原逐字符模拟，原样保留）接手。这样畸形输入的越界读行为一字不变。同进程 A/B 实测纯解析 **1.25×**（真实语料 68 条、平均长 41 字符，快路径 68/68 命中）。 |
| **B7 `matrixType0` 只解析最后一行** | **换了形态**：`ymode 0/1` 的列数推断依赖**第 2 行**，只解析末行拿不到 `cols`。等价收益改由 A4 的「一次解析同时出类型码」取得；`matrixType0()` 本身保留轻量实现（不构造 `matrixParse` 的复合返回对象），避免给 `typeOf()` 添额外对象分配。 |

> 早期评估里跨批次测出的 `less 2.18×` 受机器负载影响；本报告一律以
> **同进程 A/B**（优化前 / 后两份 bundle 同时载入、交替调用、5 轮中位数）
> 为准，数值见下节与 `bench-baseline.json`。

### 展开树连续展开护栏（比性能更重要的 bug 修复）

`TreeEngine.click(..., continuous=true)` 里的 `for(;;)` 只以「下一行不是极限序数」
为终止条件。四个 PPS4 弱化变体
（`pps4_weak` / `pps4_second` / `pps4_third` / `pps4_extremely_weak`）
连续展开出的新节点始终被判为极限，链表无限增长：实测 **15 秒吃满 1 GB 堆**后
V8 直接 `FATAL ERROR: ... heap out of memory`，页面进程被杀。
单击模式（`continuous=false`）完全正常，对照组 `pps4` 也正常。
这四个记号在 `verify:notations` / `integration` 里都通过，因为那些测试没跑连续展开。

修复：`src/core/tree.ts` 加 `CONTINUOUS_EXPAND_GUARD = 10_000`，
单次点击最多插入 1 万个节点，到顶 `break`。**只加护栏、不改任何展开规则**：
正常记号（实测 `ppm00t` 连续 8 次 3073 行、`bashicu_matrix` 214 行、
`pps2` 130 行、`zero_y` 214 行、`stos` 81 行）在到上限前早就收敛，
单击模式与序数尺完全不受影响；四个弱化变体现在同步返回、行数停在 10003，
耗时 5~28 ms。护栏修好后，`npm run bench:notations` 全 30 个记号 **0 异常**。

---

## 四、收益（同进程 A/B，值 >1 = 优化后更快）

| 指标 | 全部 10 个代表记号 | 矩阵系 7 个 |
|---|---|---|
| `fs` | **1.60×** | **1.75×** |
| `less` | **1.47×** | **1.53×** |
| `firstExceeding`（冷路径） | **1.37×** | **1.40×** |
| `pred` | 1.02× | 1.05× |
| `typeOf` | 1.01× | 1.00× |
| `fsLimit` | 0.99× | 0.99× |

`typeOf` / `pred` / `fsLimit` 基本持平是**预期**：它们的瓶颈是固定长度数组
分配，而本轮刻意没有动（见下节）。收益集中在「比较」与「展开」两条热路径，
正好是 `firstExceeding` 二分和展开树点击最常走的地方。

---

## 五、验证（全部通过）

| 验证 | 结果 |
|---|---|
| 全量输出快照：30 记号 × `fsLimit(0..7)` × (`typeOf` / `pred` / `fs(0..3)`) + 64 组 `less` 交叉比较，优化前后 JSON **逐字相同** | ✅ |
| 同值 FNV-1a 哈希固化进回归：`1506148283`（`verify_notations.mjs` D1 组） | ✅ |
| `txma` 快路径 / 回退差分 fuzz：3527 条语料（含随机畸形串）× 2 种 C × 3 种 ymode = **21162 组**，`m / rows / cols` 全等 | **0 mismatch** |
| 40 条畸形矩阵串（嵌套 / 未闭合 / 非数字 / 尾部多余 / 两位数）在 4 个矩阵记号上的 `typeOf` / `pred` / `fs(1)` 逐字一致，固化进 D2 组 | ✅ |
| 正常记号连续展开 8 次的行数与优化前一致（D3 组，护栏未误伤） | ✅ |
| `npm run verify:notations` | **99 / 99**（原 95 + 新增 4 条） |
| `npm run verify` / `check-names`（30 个一致）/ `integration`（30 个记号初始化 0 失败）/ 前端 esbuild 打包 | ✅ |
| `npm run bench:notations` 全 30 个记号 | **0 异常** |

---

## 六、明确没动（保持你定的口径）

| 项 | 原因 |
|---|---|
| `fs(n)` 块数偏移、各记号 `ex()` 展开规则 | 之前实测：改了 `firstExceeding` 扫满 100 万项不收敛、`validate` 逼近链断裂、序数尺抛错 |
| `txar()` 的固定 501 元素预分配 | 试过改成短数组：`typeOf` / `less` 更快，但 `zero_y` 的 `fs` **慢 2 倍**（`ex()` 往远处下标写会触发稀疏数组扩张）。保留预分配 |
| 把 `txar` 换成 `Int32Array` | `ex()` 可能写到 501 之外，类型化数组越界写**静默丢失** → 语义变化 |
| `firstExceeding` 的指数+二分、`validate` 的 GUARD、`BoundedCache` | 已是优化结果 |
| LELS 差值表 / RRSS 坏根 / RCS fallback / PPS 家族三处偏差 | 定义不闭合或已按原作者代码更正 |
| `txmaLegacy` 的行为 | 原样保留作为畸形输入回退，保证越界读口径不变 |

---

## 七、复现

```bash
npm install
npm run bench:notations                      # 全 30 个记号
npm run bench:notations -- --only bashicu_matrix,pps2,lels
npm run bench:notations -- --timeout 20 --heap 256 --json bench.json
npm run verify:notations                     # 99 条，含 D 组输出快照锁定
```

`bench_notations.mjs` 的选项：`--timeout SEC`（默认 20）、`--heap MB`（默认 256）、
`--only IDS`、`--json PATH`。它和 `tools/crosscheck.py` 是两个不同用途的工具：
前者测速（打 TS 插件），后者对拍（TS ⇄ 26 个 exe），见 [`crosscheck.md`](./crosscheck.md)。

**基线数据**：[`bench-baseline.json`](./bench-baseline.json) 收录
① 同进程 A/B 加速比、② 落地后全 30 记号原始数值、③ 落地前全 30 记号原始数值。
这些是沙盒单次实测的 ms/次，**只用于本仓库自身的前后对比**，跨机器或跨
Node 版本不可直接比较；要严谨对比请用上面第四节的同进程 A/B 方法。

---

## 八、已知限制与后续可选项

- 四个 PPS4 弱化变体的连续展开现在会插入约 1 万个（内容重复的）节点后停下。
  护栏只保证「不 OOM」；重复节点本身来自记号展开链不收敛，属定义层问题，
  **本轮不改**。若在意 UI 观感，可另加「新节点表达式与上一轮相同则提前 break」，
  但那会改变展开树行为，需单独评估。相应地 `bench:notations` 里这 4 个记号的
  `treeClick` 数值会明显高于其它记号（每次点击都插满 1 万节点），属预期而非性能回退。
- `ppm00t` 连续展开 8 次已到 3073 行；继续点会触发 1 万上限。这是护栏设计内的行为。
- `matrixType0()` 仍会为「末行是否全 0」解析整个矩阵；B7 的原设想受列数推断限制，
  目前收益已由 A4 取得，若要再省需重构 `ymode 0/1` 的列数推断，风险高于收益。
- `tests/bench.ts` 保留原样（两个内置记号 + 引擎组合），与新增的
  `bench:notations` 互补，不重复。

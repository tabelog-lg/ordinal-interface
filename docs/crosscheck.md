# 对拍工具：仓库 TS 记号 ⇄ 26 个 ONP2 exe

> 脚本：[`../tools/crosscheck.py`](../tools/crosscheck.py)（原名 `对拍.py`，入库后改为 ASCII 名）。
> 仓库内**所有文件名一律 ASCII**；本文提到的中文字符串都是**用户提供的原始 exe 文件名**，
> 属于外部数据、由脚本按原名查找，不是仓库内文件名，也不要改名。
> 历史轮次的产物已归档在 [`reviews/`](./reviews/README.md)。

## 它做什么

`tools/crosscheck.py` 把 `src/notations/*.ts` 的 30 个记号打包成一个**和 exe 完全同构的
ONP2 控制台程序**，然后把同一批命令流分别喂给 exe 和 TS，逐行比对输出。

两边都走协议原文那五条命令，所以差异一定是实现差异，不会是适配层造成的：

| 命令（每个 token 一行） | TS 插件方法 | 输出 |
|---|---|---|
| `1` `<n>` | `fsLimit(n)` | Limit 基本列第 n 项 |
| `2` `<expr>` | `typeOf(expr)` | `1`=0 / `2`=后继 / `3`=极限 |
| `3` `<expr>` | `pred(expr)` | 前继序数 |
| `4` `<n> <expr>` | `fs(n, expr)` | 基本列第 n 项 |
| `5` `<a> <b>` | `less(a,b)` | `2`=a<b / `1`=a≥b |

启动后的前两行握手（`Ordinal Notation Protocol 2` + 记号名）会跳过，只比对命令结果。
**表达式语料不靠猜**：先用 exe 的命令 1 产出一批合法表达式，再拿这批串去跑命令 2/3/4/5，
所以逗号序列、矩阵、括号串、空格序列、含 `w` 的 STOS 等形态都能自动覆盖。

---

## 三步跑起来

1. 把 26 个 exe 放到仓库根目录（或放别处，用 `--exe-dir` 指过去）。
2. 在仓库根目录跑一次 `npm install`（要的是 `esbuild`；仓库自带 `package.json`）。
3. 从仓库根目录运行：

```bash
python tools/crosscheck.py                       # 全量 26 个
python tools/crosscheck.py --only zero_y,stos    # 只挑两个，快速试水
python tools/crosscheck.py --limit-n 12 --fs-ns 0,1,2,3,5,10 --deep   # 加深
```

全量默认约 4000+ 条命令，实测 3~4 分钟。需要 Node.js；Windows 上直接跑 exe，
Linux/macOS 装了 wine 会自动启用。若 `esbuild` 不在常规位置，用
`--esbuild /path/to/esbuild` 指定。

> 实测提醒：这批 exe 在 stdin EOF 后**不会退出**（继续等下一条命令），所以
> `subprocess.run(['0-Y.exe'], input=b'2\n0\n', timeout=5)` 会一直卡到超时——
> 哪怕结果早就打印在 stdout 里了。

---

## 关于「exe 在 EOF 后不退出」

脚本**不再等进程结束**，而是按协议数 stdout 行数：

| 调用 | 期望行数 | 构成 |
|---|---|---|
| `run_batch` | `2 + len(cmds)` | 两行握手 + 每条命令一行 |
| `run_one` / `handshake` | `3` | 两行握手 + 一条命令的结果 |

实现上是 `Popen` + 后台线程逐行读 stdout，读够行数立刻 `terminate()`；
另有线程排空 stderr，防止 stderr 管道被写满反过来把 exe 卡住。
进程若正常退出（stdout EOF）也会立即收尾，不必等满超时。由此带来三点：

- `--timeout` 的含义是**「等够输出行的上限」**，不再是等进程退出；
- 真卡死（活着但不输出）仍判为 `TIMEOUT__`，并整批回退成逐条单跑定位是哪条命令；
- terminate 之后 stdout 会 EOF，代码先把「超时」记账再收尾，不会把卡死误标成崩溃。

批量喂命令时 stdin 写入在主线程，默认 `--chunk 24` 的 payload 只有几 KB，
远小于管道缓冲；若把 `--chunk` 调到几百以上，留意别让单次写入过大。

---

## 26 个 exe → TS 记号映射（脚本内置，无需配置）

| 你的 exe | 仓库 id / 文件 |
|---|---|
| `0-Y.exe` | `zero_y` |
| `0-Y超无提升.exe` | `zero_y_super_non_lifting` |
| `Bashicu Matrix.exe` | `bashicu_matrix` |
| `BM4.1.exe` | `bm41` |
| `BMS Stronf.exe` | `bms_stronf` |
| `BMS Upgradissimo.exe` | `bms_upgradissimo` |
| `BMS行延伸无ceiling.exe` | `bms_row_extend` |
| `Coprime Sequence.exe` | `coprime` |
| `HIUN.exe` | `hiun` |
| `KP hydra.exe` | `kp_hydra` |
| `LELS(ω进制阵).exe` | `lels` |
| `LPrSS.exe` | `lprss` |
| `Multiple Father Sequence System.exe` | `mfss` |
| `Parented BMS.exe` | `parented_bms` |
| `Parented Predecessor Matrix 00T.exe` | `ppm00t` |
| `Parented Predecessor Matrix 3.exe` | `ppm3` |
| `Parented Predecessor Matrix.exe` | `ppm` |
| `Parented Predecessor Sequence 3.exe` | `pps3` |
| `Parented Predecessor Sequence 4.exe` | `pps4` |
| `Parented Predecessor Sequence.exe` | `pps2` |
| `Parented PrSS.exe` | `prss_parented` |
| `PSS hydra.exe` | `pss_hydra` |
| `Remainder Retention Sequence System.exe` | `remainder_retention` |
| `Residue Class Sequence.exe` | `residue_class` |
| `Simplified -2-Y.exe` | `simplified_minus2y` |
| `STOS.exe` | `stos` |

> 仓库有 30 个 TS 记号，你手上是 26 个 exe。缺的 4 个是 PPS4 变体
> （`pps4_weak` / `pps4_second` / `pps4_third` / `pps4_extremely_weak`），默认跳过。
> 若你也有它们的 exe，用 `--exe-map` 补上即可，例如：
> `python tools/crosscheck.py --exe-map '{"pps4_weak":"Parented Predecessor Sequence 4 weak"}' --only pps4_weak`

**PPS4 已替换（2026-11-08）**：与你 exe 不符的旧复原版已删除，11/7 那份实现
扶正为唯一的 `pps4`。所以上表 `"pps4": "Parented Predecessor Sequence 4"`
现在直接指向你 exe 对应的实现，**不再需要** `--exe-map` 转接 `pps4_v2`。
两版对照见 [`pps4-v2.md`](./pps4-v2.md) 与 [`pps4-v2-changes/`](./pps4-v2-changes/README.md)。

---

## 报告怎么读

产物默认在 `<仓库>/crosscheck-results/`（**文件名全 ASCII**）：

| 文件 | 用途 |
|---|---|
| `crosscheck-report.json` | 每个记号的汇总、按命令类型 / 语料来源的细分统计 |
| `diff-details.txt` | **先看这个**：每条差异的完整命令与双端输出，可直接复制去手动复核 |
| `commands.jsonl` | 全部命令的双端原始输出，逐条可复查 |
| `name-mismatch.txt` | exe 自报记号名 vs TS 插件 `name` |

每条命令被归到下面几类之一：

| 分类 | 含义 | 要不要管 |
|---|---|---|
| `ok` | 两边输出一致 | — |
| `mismatch` | **两边都正常但输出不同** | 重点查，这才是复原差异 |
| `ts_only_bad` | exe 正常，TS 抛异常 / 超时 / 崩溃 | 重点查，TS 侧可能死循环 |
| `exe_only_bad` | exe 超时 / 崩溃，TS 正常 | 多见于变异出的非法输入，原 exe 本来就不设防 |
| `both_bad` | 两边都挂 | 一般是非法输入，参考价值低 |

明细里的 `source` 标明表达式来历，判读时很关键：

- `probe` = exe 命令 1 自己产出的**合法**表达式 —— 这类差异最值得追；
- `seed` = 手工补的边界串（如 `0`、`w`、`(0)`）；
- `mut` = 故意变异出的非法串 —— 这类差异基本是「原 exe 不校验输入」，不算复原错误；
- `deep` = 命令 4 的输出再当语料（`--deep`）。

脚本默认把 `mismatch` 和 `ts_only_bad` 视为失败并返回退出码 1，方便挂 CI；
加 `--no-fail` 可关掉。退出码：`0` 无实质不一致、`1` 有不一致或 TS 单侧异常、
`2` 环境/配置错误。

### 历史产物归档

上一轮用**真实 exe** 跑出的两份结果，已按 ASCII 文件名归档在
[`reviews/`](./reviews/README.md)，格式与上面完全一致：

| 归档文件 | 对应产物 |
|---|---|
| [`reviews/audit-crosscheck-summary.json`](./reviews/audit-crosscheck-summary.json) | `crosscheck-report.json`（26 个记号、5626 条命令、`name_mismatch` 清单） |
| [`reviews/audit-diff-details.txt`](./reviews/audit-diff-details.txt) | `diff-details.txt`（316 条不一致明细） |

判读那轮结果的结论见 [`reviews/README.md`](./reviews/README.md) 与
[`IMPLEMENTATION-NOTES.md`](./IMPLEMENTATION-NOTES.md)：排除 LELS 与 exe 自身
的崩溃残片 / 空输出 / 未初始化垃圾值后，实质性差异只有 `pps4` 的命令 4；
该项已通过 11/8 的替换解决。

---

## 已知需要留意的点

- **ppm3 的握手名对不上是仓库本身的遗留**：`Parented Predecessor Matrix 3.exe`
  自报的名字是 `Parented Predecessor Matrix 2`（与 PPM 同名），而 TS 侧 `name`
  是 `Parented Predecessor Matrix 3`。只出现在 `name-mismatch.txt`，不影响命令对拍。
- **LELS 的 compare 是刻意修过的**：原 exe 的 `compare0` 只按第二个参数的列数比较、
  不反对称，作者按原始源码修成了取两侧列数较大值。列数不同的 `5` 命令出现差异
  是预期行为，不是 bug。
- **某些输入会让程序卡住**：例如 LELS 对单列矩阵 `(0)` 展开，TS 侧会跑很久。
  按行数收尾的机制会在 `--timeout` 后终止该进程，整批回退成逐条单跑并标成
  `ts_only_bad`，不会拖死整轮。
- **若报告里全是 `__EXE_TIMEOUT__`**：说明 exe 没按「每条命令恰好一行、及时 flush」
  输出（管道下 C 运行时默认全缓冲）。这是协议要求，先确认 exe 自身行为；
  脚本按行数等待，不会替 exe 补 flush。
- **别把 exe 放在中文路径太深的地方**：路径含中文没问题，但个别老控制台程序
  对路径敏感；出问题可先挪到纯 ASCII 目录试。

---

## 参数速查

```
--repo PATH        仓库根目录（默认：tools/ 的上一级，即仓库根）
--exe-dir PATH     exe 目录（默认同 --repo）
--exe-ext EXT      exe 扩展名，默认 .exe
--exe-by-id        用记号 id 当 exe 文件名（配 --exe-ext "" 可拿 C++ 复原版当替身自测）
--exe-map JSON     覆盖 / 追加「id -> 文件名主名」映射
--esbuild CMD      指定 esbuild（找不到时自动试 node_modules / PATH / 全局 / npx）
--only IDS         只跑指定记号，逗号分隔，可多次
--limit-n N        命令 1 取 fsLimit(0..N-1)，默认 8
--fs-ns LIST       命令 4 的 n 列表，默认 0,1,2,3,5
--pairs N          命令 5 随机配对数，默认 40
--seed N           随机种子，默认 20261107
--deep             把命令 4 输出再当语料跑一轮
--deep-k N         --deep 取多少新语料，默认 8
--no-mutate        关掉变异（非法输入）用例
--chunk N          每批命令数，默认 24；别调太大（stdin 写入在主线程）
--timeout SEC      等够输出行的上限，默认 10（不是等进程退出）
--crlf             命令之间用 \r\n 分隔（默认 \n）
--wine / --no-wine 非 Windows 平台强制 / 禁用 wine
--no-fail          有差异也返回 0
--out PATH         报告输出目录（默认 <repo>/crosscheck-results）
```

### 拿仓库自带的 C++ 复原版当替身先练手

不用你的 exe 也能验证脚本本身跑得对：

```bash
cd docs/restored/cpp && make
cd ../../
python tools/crosscheck.py --exe-dir docs/restored/cpp/bin --exe-ext "" --exe-by-id
```

---

## 自测记录（供参考，结论以你的真实 exe 为准）

用仓库 `docs/restored/cpp/` 编译出的 C++ 复原程序当替身，验证过脚本链路：
EOF 正常退出与 EOF 不退出两类进程都能正确收尾；造一个「按 ONP2 正常应答、
但 stdin EOF 后 `sleep 60` 不退出」的假 exe，旧写法
`subprocess.run(input=..., timeout=2)` 如期卡死，新写法单条交换 0.02s、
批量 6 条 0.01s 拿到结果，`run_batch` / `run_one` / `handshake` 全部正常；
只输出握手就沉默的假 exe 正确判成 `timeout`，没被 terminate 后的 EOF 误标成 crash。

**注意 C++ 复原版不是你手里的原始 exe**——复原版和 TS 同源，且自身有若干
「保留原味」的边界行为，替身跑出的差异只用来证明脚本可用，真实结论请以
26 个 exe 跑出来的报告为准。

**测速是另一个工具**：`npm run bench:notations`（[`../tests/bench_notations.mjs`](../tests/bench_notations.mjs)）
覆盖全部 30 个记号的五个原语与 UI 组合，报告见 [`performance.md`](./performance.md)。
本工具只做「TS ⇄ exe 逐条对拍」，不做性能测量。

工具目录说明见 [`../tools/README.md`](../tools/README.md)，文档总导航见
[`README.md`](./README.md)。

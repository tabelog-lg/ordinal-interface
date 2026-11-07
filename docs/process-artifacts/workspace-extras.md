# 工作区临时文件说明

> 这份文档说明：做这个项目期间，工作区里除了**安装内容**（`node_modules`）、
> **编译产物**（`dist`）和**工程文件**（`ordinal-interface/` 等）之外，还留下了哪些东西。
>
> 结论：**有**。归档在 `workspace-extras.zip` 里，共三类——交付物副本、下载缓存、远端仓库快照。
> 真正"随手写的"探针脚本、截图、基准数据大部分当时就删了，且 `/tmp` 在沙盒重建时被清空，
> 已无法恢复（见文末清单）。

---

## 一、归档包结构

```
workspace-extras/
├─ README.md                       本说明（包内也放了一份）
├─ deliverables/                   ① 已经给过你的交付物副本
│  ├─ bench.ts
│  ├─ verify.ts
│  ├─ package.json
│  ├─ ordinal-interface-web-src.zip
│  └─ restored-vb.zip
├─ download-cache/                 ② 远端仓库的下载缓存（.tgz）
│  ├─ repo.tgz
│  └─ r2.tgz
└─ snapshots/                      ③ 解压出来的远端仓库工作副本
   ├─ ghrepo/                     commit 05293d8 时点
   └─ ghrepo2/                    commit bd2a297 时点
```

> 快照里已排除 `node_modules/` 和 `dist/`，只留源码与文档。

---

## 二、逐项说明

### ① `deliverables/` —— 已交付过的文件副本

这些**不是临时文件**，是前几轮给你的交付物，只是当时直接放在工作区顶层没归置。
你手上已经有了，这一份纯属备份，可以直接忽略。

| 文件 | 是什么 | 产生环节 |
|---|---|---|
| `bench.ts` | 性能基准脚本（`npm run bench`），测引擎查询、二分查找、绘制、尺与树的耗时 | 做性能优化时先量后改写的；后来发现仓库里没推上去，又单独给了一次 |
| `verify.ts` | 完整自检脚本，185 项断言（含二分 vs 线性扫描的交叉验证、缓存容量上限） | 性能优化后补全；发现远端只剩 74 项，又单独给了一次让你覆盖回去 |
| `package.json` | 仓库版基础上补了 `verify` / `bench` / `check-names` 三条 script | 同上，配合上面两个脚本一起给的 |
| `ordinal-interface-web-src.zip` | 完整源码包（Vite + TypeScript 工程，含 `docs/`） | 性能优化做完后重新打的包 |
| `restored-vb.zip` | 还原出的 VB.NET 工程（`docs/restored/vb/` 下的全部文件） | 把 VB 源码放进仓库时打的查看用包 |

### ② `download-cache/` —— 远端仓库下载缓存（纯临时，可删）

用 `codeload.github.com` 拉远端 `main` 分支的 tarball，解压后用来做对比和验证。
**内容 = 远端仓库在那一刻的完整快照，没有我额外写的东西。**

| 文件 | 对应时点 | 用途 |
|---|---|---|
| `repo.tgz` | `05293d8`（"Add 30 new notations…"，即 30 个记号刚接进去） | 第一次核对远端：跑构建、自检、30 个记号的集成实验、发现 LELS 问题 |
| `r2.tgz` | `bd2a297`（"Fix the code issue in LELS…"） | 第二次核对：确认我给的两个文件已入库、LELS 修复生效、185 项断言全绿 |

### ③ `snapshots/` —— 解压后的远端工作副本（纯临时，可删）

就是上面两个 tarball 解压出来的目录，我在里面跑过 `npm install`、`npm run build`、
`npm run verify` / `bench`，以及若干一次性探针脚本（已删，见文末）。

两份快照之间的差异，正好就是 `bd2a297` 那次 LELS 修复的内容：

| 差异文件 | 说明 |
|---|---|
| `src/notations/lels.ts` | 核心修复：比较宽度改取两侧列数较大值（原实现只由第二个参数决定，导致 `less` 不反对称、`validate` 返回 false）；另修了 `Ex()` 里扫描变量 `k` 与填充变量 `au` 被合成一个、以及扫到底时 `lf` 被清零两处复原 bug |
| `docs/restored/lels-original-source/LELS.cpp` | 新增：作者提供的 LELS 原始源码留档 |
| `docs/restored/cpp/notations/lels.cpp`、`cpp/README.md`、`docs/restored/README.md` | C++ 侧同步修正与说明 |
| `INTEGRATION.md` | 新增「已修：LELS 的 compare 不反对称」一节 |
| `tests/lels_probe.mjs` | 新增：排查时用的探针（打印 `validate`、`fsLimit`、`less` 关系） |
| `tests/bench.ts`、`tests/verify.ts`、`package.json` | 我给的两个脚本 + 三条 script 入库 |

> 换句话说：**`ghrepo2/` 就是远端仓库现在的样子**，`ghrepo/` 是修复前的样子。
> 你自己 `git clone` 或 `git log` 都能拿到，这两份没有独占价值。

---

## 三、已删除、现在找不回来的临时文件

以下都是过程中用过、当时随手 `rm` 掉的；加上 `/tmp` 在沙盒重建时被清空，
**文件已不存在，无法一并给你**。列在这里只是交代清楚，免得你以为漏了什么。

| 类别 | 具体是什么 | 为什么没了 |
|---|---|---|
| 浏览器截图 | 五个页签的 `--headless` 截图 `shot-{ruler,tree,misc,notation,settings}.png`、裁剪图 `crop-*.png`、查看用 `view-*.png` | 验证完就删了；且都写在 `/tmp` |
| 性能基准数据 | `bench-before.txt` / `bench-after.txt` / `bench-after1.txt`（优化前后的逐项耗时） | 写在 `/tmp`。**结论已进 README 的性能章节**（那张前后对比表就是据此算的），原始数值没留 |
| esbuild 中间产物 | `/tmp/verify.mjs`、`/tmp/bench.mjs`、`/tmp/*.mjs` 等一堆打包输出 | 同上 |
| 一次性探针脚本 | 注册表装载验证页 `tmp-regcheck.ts/html`；名字一致性 `cn_tmp.ts`；30 记号深度测试 `deep_tmp.ts`；基本列递增检查 `mono.ts` / `mono2.ts`；LELS 定位 `lels_tmp.ts` / `l2.ts` / `l3.ts` / `l4.ts` / `lelscheck.ts` | 都是临时建、跑完即删 |
| API 响应缓存 / 日志 | `/tmp/r.json`、`/tmp/c.json`、`/tmp/ar.json`、`/tmp/pg.json`、`/tmp/http.log` 等 | 查 GitHub API 时的中间文件 |

其中**唯一有点留存价值的是性能基准的原始数据**。如果需要，可以现在跑一次
`npm run bench` 重新生成当前数据；但"优化前"那组数值只能从 README 的对比表里反推，
没法精确复原（当时用的是优化前的 `host.ts`，那份代码已被二分实现覆盖）。

---

## 四、明确没给的东西

按你的定义排除掉的：

- **`node_modules/`** —— 安装内容，三个工程副本里都有
- **`dist/`** —— 编译产物（含 `index.html`、`selftest.html`、`assets/*.js`）
- **`ordinal-interface/`** —— 工程主体（源码、文档、测试），这是项目本身，不是"其他东西"
- **`/tmp` 下的全部内容** —— 见上节，已清空

---

## 五、怎么处理这个包

- **只想留个底**：保留 `deliverables/` 就行，其余两类删掉不心疼。
- **想彻底清爽**：整个 `workspace-extras.zip` 都可以删 —— 交付物你已收到，
  远端仓库已是最新且带完整 git 历史，两份快照和 tarball 都是重复信息。
- **想复现某次验证**：`snapshots/ghrepo2/` 解压后 `npm install && npm run verify`，
  能跑出当时的 185 项全绿结果。

# 把 30 个记号加进 ordinal-interface —— 改动清单

我把 30 个记号真的接进了项目副本（`integration/`），跑通了类型检查，
并用宿主的真实代码（EngineHost / 序数尺 / 展开树）做了实证。下面是结论。

---

## 一、代码需要动的地方

### 必须改（已改好）

| 文件 | 改动 |
|---|---|
| `src/engine/plugins.ts` | ① `BuiltinDef` 加 `name` 字段；② `BUILTINS` 追加 30 项；③ `restorePlugins()` 改为从表取名字；④ 新增 `NOTATION_NAMES` 表 |
| `src/notations/**`（新增） | `core/` 4 个文件（seq / matrix / bms / vb）+ 30 个记号 + `index.ts` |
| `src/notations/*.ts`（新增） | 适配仓库的严格 tsconfig（见下） |

`BUILTINS` 里 30 项放在两个原有内置**之后**，所以默认记号仍是 `Omega2 (w^2)`，
老用户 `lastPluginId` 不受影响。

### 为什么 `BuiltinDef` 要加 `name`

原实现是这样取名字的：

```ts
await Promise.all(BUILTINS.map(async (b) => {
  builtinNames.set(b.id, (await b.load()).name);   // ← 启动时 import 每一个
}));
```

2 个记号无所谓；32 个记号时，`restorePlugins()` 会把**全部 32 个模块的代码在首屏拉下来**
——`BUILTINS` 用动态 import 做懒加载的设计就被废掉了。改成表里写死名字后，
启动时零 import，只有选中某个记号时才加载它。

代价是名字要维护两份。我加了断言脚本 `tests/check_names.mjs` 兜底，
它当场抓出了 `ppm3` 的不一致（详见下文"坑 4"）。

### 仓库 tsconfig 比我的原工程严格，要补的几处

仓库开了 `noImplicitOverride` / `noUnusedLocals` / `noUnusedParameters` / `useDefineForClassFields`：

* 所有覆盖基类成员的字段、方法补 `override`（`readonly name`、`protected bias`、
  `protected C`、`protected ymode`、`protected ex/limitArr/parse/out/copyRow`、
  `typeOf/pred/fs/less`）；
* `bms_row_extend.ts` 里一个没用到的 `par` 数组、`residue_class.ts` 里没用到的 `SEQMAX` 删掉。

`tsc --noEmit` 结果：**新增代码零错误**，只剩仓库原有的
`src/main.ts(8,8): Cannot find module ... './style.css'`（基线就有，与本次无关）。

---

## 二、按源 exe 实测修正的两处（已改）

首轮实测发现的问题，用**源 exe** 复核后发现是我复原错了，不是记号的问题。
已按源 exe 给出的标准实现修正（TS 与 C++ 两侧同步）：

### 修正 1：5 个记号的「最大序数的基本列」

原先按反编译产物复原成"忽略参数、恒给 `1`"，源 exe 实测是 **第 a 项 = `1,a+1`**：

| 记号 | 修正后 `fsLimit(0..3)` |
|---|---|
| `zero_y` / `zero_y_super_non_lifting` / `coprime` / `simplified_minus2y` / `residue_class` | `1,1` `1,2` `1,3` `1,4` |
| `remainder_retention`（空格分隔） | `1 1` `1 2` `1 3` `1 4` |

原先这 6 个的序数尺与展开树会退化（基本列坍缩成常数，根节点落在最小有限数上）。
修正后：**命令 1 输出恒定的记号 = 0 个**（原先 6 个）。

### 修正 2：`remainder_retention` 的展开

源 exe 实测 `"1 2"` 的基本列是 `1 / 1 1 / 1 1 1 / 1 1 1 1`，原先从 n=1 起就恒为 `1 1`。
原因是复制段起点与父指针平移量算错：复制段应为 `[base+1, x]`、
段长 `L = x - base`，新下标与源下标间距恒为 `c*L`。

修正后实测：`fs(0..3, "1 2")` = `1` `1 1` `1 1 1` `1 1 1 1` ✓

### 仍然保留的 2 处（源 exe 本就如此）

* **`mfss` 的 limit 前两项相同**：`0 / 0 / 0,1 / 0,1,2` —— 源 exe 实测如此，未改。
  `firstExceeding` 会跳到 index 2，能跑，单调性抽查擦边过。
* **`ppm3` 与 `ppm` 同名**：PPM3 的 exe 里 `name0()` 打印的就是
  `"Parented Predecessor Matrix 2"`（跟 PPM 一样），列表会出现两条同名。
  想区分可给 `src/notations/ppm3.ts` 的 `name` 加后缀，但那样就不再等于 exe 输出。

PPM3 的 exe 里 `name0()` 打印的就是 `"Parented Predecessor Matrix 2"`（跟 PPM 一样），
我忠实保留了，于是列表里会出现两条同名。想区分的话，给 `src/notations/ppm3.ts`
的 `name` 加个后缀即可，但那样就不再等于 exe 输出了。

---

## 三、可选（不影响跑起来）

* **UI**：32 条列表。`.listbox` 有 `overflow: auto` 能滚动，可用；但建议按
  序列 / 矩阵 / 括号串分组，或加个搜索框。
* **文档**：`README.md` 第 28–35 行的"内置两个记号"表格、第 86–87 行目录结构、
  第 144 行"新增一个内置记号只需两步"；`index.html` 第 35 行的 hint。
* **测试**：`tests/verify.ts` 里加 30 个记号的冒烟断言（装载 + init 不抛异常）。
* **`public/plugins/`**：`plugins/*.plugin.js` 是自包含单文件，
  也可以直接放几个进去当"上传用"的示例。

---

## 四、文件清单

```
integration/                       ← 已改好的项目副本
├── src/engine/plugins.ts          ★ 改：BUILTINS +30、BuiltinDef 加 name、NOTATION_NAMES
├── src/notations/                 ★ 新增
│   ├── index.ts                   30 个记号的注册表
│   ├── core/{seq,matrix,bms,vb}.ts
│   └── {30 个记号}.ts
└── tests/
    ├── integration.mjs            实验 1：宿主 + 序数尺 + 展开树跑 30 个
    ├── integration2.mjs           实验 2：查命令 1（基本列）形态
    ├── i3.mjs                     实验 3：给定表达式后展开是否递增
    └── check_names.mjs            断言：名字表与实现一致
```

跑实验：`node tests/<name>.mjs` 需先用 esbuild 打包（见各文件顶部），
或直接 `npm run build` + 开页面。

# 实现审查与基准资料

> 本目录是 **2026-11-07 实现审查轮次**的全部原始文稿，逐字归档，未作改写。
> 审查对象是 `src/notations/` 下的复原记号插件（当时 31 个，2026-11-08 起为 30 个），判定基准是用户逐字提供的定义
> 原文、Googology Wiki 页面全文、ONP2 协议与作者提供的 C++ / VB 源码。
>
> **审查文稿只描述当时的状态**；之后的修正与「哪些按报告改了、哪些有意保留」
> 见 [`../IMPLEMENTATION-NOTES.md`](../IMPLEMENTATION-NOTES.md)。
> 本目录**不参与构建**，也不被 `tsconfig.json` / vite 处理。

---

## 目录内容

### 11 份实现审查 / 源码对照报告

| 报告 | 记号 | 审查结论（原文判定） |
|---|---|---|
| [`audit-0-Y.md`](./audit-0-Y.md) | 0-Y | 不完全遵守：核心展开语义忠实，但 `fs(n)` 长度系统性多 `l-1` 项 |
| [`audit-BMS.md`](./audit-BMS.md) | Bashicu Matrix | 不完全遵守：三个 Wiki 实例逐列吻合；`fs(n)` 多 1 块、两位数解析缺陷 |
| [`audit-LPrSS.md`](./audit-LPrSS.md) | LPrSS | 不完全遵守：540 次差分零差异；`fs(n)=S[n+1]` |
| [`audit-KP-Hydra.md`](./audit-KP-Hydra.md) | KP Hydra | 不完全遵守：420 次差分零差异；零/后继 `fs` 输出非法括号串 |
| [`audit-PSS-Hydra.md`](./audit-PSS-Hydra.md) | PSS Hydra | 不完全遵守：Wiki 三实例精确验证；`fs(n)=P[n+1]` |
| [`audit-PPS-family.md`](./audit-PPS-family.md) | PPS / PPM 全族 | 不完全遵守：Wiki 四长表达式逐项一致；三处实质偏差、PPM 版本归属不符 |
| [`audit-RRSS.md`](./audit-RRSS.md) | RRSS | 不完全遵守：核心「保留余数、只累加商」忠实；坏根/坏部/降链偏离 |
| [`audit-RCS.md`](./audit-RCS.md) | RCS | 无法完全判定：非 fallback 560/560 一致；fallback 定义未给展开规则 |
| [`audit-CpS.md`](./audit-CpS.md) | Coprime Sequence | 核心语义 1050/1050 零差异；`fb[0]=0` 构成死循环 |
| [`audit-LELS.md`](./audit-LELS.md) | LELS | 不能算完全遵守：三处可定量偏差 + 四类条款无法形式化验证 |
| [`audit-Parented-BMS-source.md`](./audit-Parented-BMS-source.md) | Parented BMS | 对应确凿：5 条协议命令 1049 次差分零差异，TS 为「修复式移植」 |

> 11 份报告共用的基准原文（用户消息、Wiki 页面全文、ONP2 协议、`Parented BMS.cpp`
> 全文、源码包索引）逐字汇编在 [`audit-reference-materials.md`](./audit-reference-materials.md)。
> 汇编开头有「报告 ↔ 基准」对照表和保真度标记（`【逐字】` / `【站点补录】` / `【转述】`）。

### 配套数据

| 文件 | 内容 |
|---|---|
| [`audit-reference-materials.md`](./audit-reference-materials.md) | 846 行，审查过程中实际使用的全部外部基准材料 + 对照表 |
| [`audit-diff-details.txt`](./audit-diff-details.txt) | 47 KB，审查差分脚本的原始不一致输出 |
| [`audit-crosscheck-summary.json`](./audit-crosscheck-summary.json) | 26 个记号的 exe ↔ TS 逐条对拍汇总（`total` / `ok` / `mismatch` / `by_tag` / `by_source`），含 `name_mismatch` 清单 |

> 后两行是 [`../../tools/crosscheck.py`](../../tools/crosscheck.py) 的运行产物，按 ASCII 名归档在此
> （原产物名 `crosscheck-report.json` / `diff-details.txt`）。工具用法、26 个 exe 的映射表、
> 报告判读口径见 [`../crosscheck.md`](../crosscheck.md)。
> **本目录文件名全 ASCII**：2026-11-08 把 11 份报告与 3 份配套数据
> 统一改为 `audit-*.md` / `audit-*.txt` / `audit-*.json`；数据文件里记录的原始 exe 名
> （含中文/希腊字母）是外部输入，按原样保留。

---

## 报告结论与本轮修正的对应关系

| 报告标 ❌ / ⚠️ 的问题 | 本轮处理 | 依据 |
|---|---|---|
| 两位数解析、`fsLimit(0)` 越界、零/后继 `fs` 产出垃圾、`pred` 违反协议、CpS / LELS / 0-Y 死循环与栈溢出 | **已修** | [`../IMPLEMENTATION-NOTES.md`](../IMPLEMENTATION-NOTES.md) §1 |
| `fs(n)` 块数偏移（0-Y / BMS / LPrSS / KP Hydra / PSS Hydra） | **保留**，改了会破坏 `firstExceeding()` / `validate()` 逼近链 | 同上 §2.1 |
| PPS 家族三处实质偏差、LELS 差值表与坏根、RCS fallback、RRSS 坏根与降链 | **保留**，定义不闭合或改动会整体改变展开输出 | 同上 §2.2–2.5 |
| `less` 字典序、PPM 名字归属、非法式静默接受 | **保留**，属实现约定 | 同上 §2.5 |

回归用例固化在 [`../../tests/verify_notations.mjs`](../../tests/verify_notations.mjs)（现 95 条，含 PPS4 替换组），
其中「契约锁定」一组直接锁住展开规则与块数偏移，防止修输入层时误伤数学语义。

---

## 怎么读

1. 想知道某个记号**与定义差在哪**：直接看对应报告开头的「结论速览」表。
2. 想核对**基准原文**：查 [`audit-reference-materials.md`](./audit-reference-materials.md) 的 A/B/C/D 分组。
3. 想知道**现在代码是什么口径**：看 [`../IMPLEMENTATION-NOTES.md`](../IMPLEMENTATION-NOTES.md)，
   不要只看审查报告——报告写的是修正前的状态。
4. 想复现差分：报告各自第 5 节「验证环境与复现」给了编译与实测命令；
   本轮新增的回归统一走 `npm run verify:notations`。
5. 想用真实 exe 重跑逐条对拍：[`../crosscheck.md`](../crosscheck.md) →
   `python tools/crosscheck.py`。

文档总导航见 [`../README.md`](../README.md)。

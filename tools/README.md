# 工具目录

`tools/` 放**开发期命令行工具**，不参与 `npm run build` / vite 打包，
也不在 `tsconfig.json` 的 `include`（`["src"]`）里。

| 文件 | 用途 | 文档 |
|---|---|---|
| `crosscheck.py` | 对拍：`src/notations/*.ts` ⇄ 26 个 ONP2 控制台 exe，逐条比五条命令的输出 | [`../docs/crosscheck.md`](../docs/crosscheck.md) |

## 关于文件名

按仓库约定，`tools/` 内文件名一律 **ASCII**。`crosscheck.py` 入库前的名字是
`对拍.py`（中文），产物目录 `对拍结果/` 与四个报告文件也都是中文名；
入库后统一改为：

| 原名 | 现名 |
|---|---|
| `对拍.py` | `tools/crosscheck.py` |
| `对拍使用说明.md` | `docs/crosscheck.md` |
| `对拍结果/` | `crosscheck-results/`（运行产物，不进仓库） |
| `对拍报告.json` | `crosscheck-report.json` |
| `不一致明细.txt` | `diff-details.txt` |
| `命令与结果.jsonl` | `commands.jsonl` |
| `握手名不一致.txt` | `name-mismatch.txt` |

> `crosscheck.py` 里 `EXE_MAP` 的**值**仍是用户提供的原始 exe 名
> （含 `0-Y超无提升`、`BMS行延伸无ceiling`、`LELS(ω进制阵)` 等中文/希腊字母）。
> 那是外部文件名，脚本按原名查找，不属于仓库内文件名，不要改。

历史轮次用真实 exe 跑出的结果，已按 ASCII 名归档在
[`../docs/reviews/`](../docs/reviews/README.md)：
`audit-crosscheck-summary.json`、`audit-diff-details.txt`。

文档总导航见 [`../docs/README.md`](../docs/README.md)。

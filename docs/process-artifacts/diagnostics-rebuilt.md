# 诊断脚本（重建）

这一组脚本**原本写在 `/tmp`**，不在工作区里。本轮整理时检查发现 `/tmp` 已被环境
清空，所以按对话记录重建了其中 6 份有复用价值的。内容与当时使用的一致，
只补了用法注释和路径说明。

它们都是**一次性诊断/验证工具**，不属于任何工程，删掉不影响构建。

| 文件 | 用途 | 怎么跑 |
|---|---|---|
| `lels_orig_patched.cpp` | 从 `lels.html`（你给的原始源码）提取出的 C++ 源码，补了一行 `static int ccbuf[V][L]; cc=ccbuf;`。原作者漏给 `cc` 分配数组，是未初始化指针，不补就跑不了命令 4 | `g++ -O0 -o /tmp/lels_orig lels_orig_patched.cpp`（**必须 -O0**：`txma()` 返回局部数组地址，`-O1` 会在 `compare0` 里段错误） |
| `cmp_lels3.py` | 拿上面编译出的可执行，与 `ONP2/bin/lels` 逐条对拍 375 条命令。把命令 5 的差异按"两侧列数是否相同"分类，用来确认 compare 的修复**只**影响列数不同的情形 | `python3 cmp_lels3.py`（需先 `cd ONP2 && make`） |
| `lels_validate_trace.js` | 手工复现 `EngineHost.validateUncached` 的逼近链，打印每步的 cursor / type / candidate / `target<cand`，用来定位 `validate("(0,0,0)(0,0,1)")` 为什么返回 false | 先把 `integration/src` 用 tsc 编到 CommonJS `/tmp/probeout2`，再 `node lels_validate_trace.js` |
| `lels_compare_audit.js` | 全项目体检：LELS 的 `fsLimit(0..5)` 逐项 validate、compare 反对称性、30 个记号里谁有 validate=false | 同上 |
| `verify_remote.py` | 用 git blob SHA（`sha1("blob <len>\0" + content)`）精确比对远端 GitHub 仓库 `main` 与本地 `integration/`，不用下载内容就能找出差异 | `python3 verify_remote.py` |
| `dl_rem.py` | `verify_remote.py` 发现差异后，用 GitHub API 把远端文件拉下来做 diff（文件名里 `/` 换成 `__`） | `python3 dl_rem.py src/engine/plugins.ts ...` |

## 没有重建的

以下也是当时的临时文件，但价值低或是纯一次性打包脚本，没重建：

- `/tmp/lels_orig_dbg.cpp` —— 给原始源码插 `fprintf(stderr, ...)` 的调试版，用来追
  `Ex()` 里 `k` / `au` / `lf` 三个变量（查 LELS 展开 bug 时用的）。
- `/tmp/lels_backup.cpp`、`/tmp/lels_backup2.cpp` —— 插桩前的文件备份。
- `/tmp/cmp_lels.py`、`/tmp/cmp_lels2.py` —— 对拍脚本的前两版（批量跑会一崩全断、
  后来改成逐条起进程），已被 `cmp_lels3.py` 取代。
- `/tmp/final.js`、`/tmp/lelscheck.js` —— 体检脚本的中间版本，已合并进
  `lels_compare_audit.js`。
- `/tmp/build*.mjs`、`/tmp/b[4-8].mjs`、`/tmp/tc.mjs` —— esbuild 打包冒烟脚本，
  每次内容只差一个 entrypoint。
- `/tmp/tsconfig.probe*.json` —— 把 `integration/src` 编成 CommonJS 的临时 tsc 配置。
- `/tmp/probeout*`、`/tmp/lels_orig`、`/tmp/lels_asan`、`/tmp/remote_dl/` —— 编译产物
  与下载缓存，按"编译产物/安装内容"排除。

## 两个踩过的坑（复现时留意）

1. **原始源码必须 `-O0`**：`txma()` 返回局部数组 `p` 的地址，是悬垂指针。
   `-O1` 下 `compare0` 会段错误；`-O0` 正常。wandbox 默认无优化选项，所以作者没踩到。
2. **`cc` 未初始化**：`expand()` 里 `int (*cc)[L]` 没赋过值就写，原作者漏了分配。
   `lels_orig_patched.cpp` 里补了静态缓冲区，这是唯一的人为改动。

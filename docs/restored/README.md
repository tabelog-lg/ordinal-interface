# 复原产物（移植依据）

`src/notations/` 里那 31 个 TS 记号不是凭空写的 —— 它们是从 ONP2 exe 的
**反编译产物**逐行复原出来的。复原的中间产物都放在这里，作为移植依据留档。

| 目录 | 内容 |
|---|---|
| `cpp/` | 31 个记号的 **C++ 复原版**（第一批 27 个 C++ exe + 第二批 3 个 VB.NET exe 的 C++ 移植） |
| `csharp/` | 第二批 3 个记号的 **VB.NET/C# 复原版**（还原回原始语言） |
| `lels-original-source/LELS.cpp` | **LELS 的原始 C++ 源码**（作者提供）—— 唯一一个有原始源码的记号，用来给 `cpp/` 和 `src/notations/lels.ts` 做逐条对拍 |

## 为什么放 `docs/` 而不是 `public/`

`public/` 下的文件会被 vite **原样拷进 `dist/`**，而这些是开发期的参考资料 ——
放进 `public/` 会白白增大线上产物。它们的性质是"这批 TS 代码是怎么来的"，
和 `docs/` 里原有的协议条文、原项目说明、标识符对照表是同一类东西。

`docs/` 不在 `tsconfig.json` 的 `include`（`["src"]`）里，也不会被 vite 处理，
只是安静地躺在仓库里。

## 怎么跑

```bash
# LELS：拿原始源码编译出的可执行给复原版做对拍（375 条命令）
# 注意：必须用 -O0 编 —— 原程序 txma() 返回局部数组地址（悬垂指针），
#       -O1 以上会在 compare0 里段错误。另外原程序 expand() 里的 cc 是未初始化
#       指针，跑命令 4 前需要给它补一个缓冲区（作者漏了声明）。
g++ -O0 -o /tmp/lels_orig lels-original-source/LELS.cpp

cd docs/restored/cpp && make          # 产出 bin/ 下 31 个可执行
python3 test.py                       # 自洽性不变量（27 个 C++ 记号）
python3 tools/check_vb.py             # 第二批 3 个：与 VB 直译版对拍
```

```bash
cd docs/restored/csharp/SimplifiedPrimitiveSequence && dotnet run
```

### 关于 `pps4_v2.cpp`

2026-11-07 又给了一份 `Parented Predecessor Sequence 4.exe.c`，是同一记号的
**另一个实现**（不是 weak / second / third / extremely weak 变体）。
`cpp/notations/pps4_v2.cpp` 与 `src/notations/pps4_v2.ts` 是它的复原版；
`cpp/common.h` 里为此加了 `DEC_SCAN_LE_WIDE` 降级模式。
两版的逐函数对照、输出差异、以及解析时发现的 `txar()` 步进修正，
见上级目录的 [`../pps4-v2.md`](../pps4-v2.md)。

## 它们和 `src/notations/` 的关系

```
反编译产物（*.exe.c）
        │  逐行复原
        ▼
docs/restored/cpp/*.cpp  ──────┐
        │                      │  移植 / 对拍基准
        │  （第二批另有 csharp/）│
        └──────────────────────┴──► src/notations/*.ts
```

C++ 版同时充当 TS 版的**对拍基准**：`tests/diff.cjs` 把同样的命令分别喂给
`docs/restored/cpp/bin/*` 和 TS 实现，逐条比输出。

## 已修正的复原错误

详见 `cpp/README.md`（"审计过程中据此修正了 7 处复原错误"）。
其中第 6、7 处是拿**源 exe** 实测后才发现复原错了 —— 对拍查不出这类问题，
因为两份实现同源同错。

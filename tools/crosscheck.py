#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
对拍：ordinal-interface 的 src/notations/*.ts  vs  你手里的 26 个 ONP2 控制台 exe
（仓库内文件名一律 ASCII；EXE_MAP 里的值是用户提供的原始 exe 名，属外部数据）
================================================================================

原理
----
这些 exe 都是 ONP2（Ordinal Notation Protocol 2）插件：启动后先输出两行握手
    Ordinal Notation Protocol 2
    <记号名>
之后进入「读命令 → 输出恰好一行结果」的循环。命令与仓库 TS 插件的五个方法一一对应：

    命令 1  "1" <n>        -> plugin.fsLimit(n)          Limit 基本列第 n 项
    命令 2  "2" <expr>     -> plugin.typeOf(expr)         "1"=0 "2"=后继 "3"=极限
    命令 3  "3" <expr>     -> plugin.pred(expr)           前继序数
    命令 4  "4" <n> <expr> -> plugin.fs(n, expr)          基本列第 n 项
    命令 5  "5" <a> <b>    -> plugin.less(a,b) ? "2":"1"  a<b ?

本脚本把 TS 插件打包成一个**同样走 stdin/stdout 的 ONP2 控制台程序**，然后把
完全相同的命令流分别喂给 exe 和 TS，逐行比对输出。这样两边连输入格式都不用转换，
差异一定是实现差异，不会是适配层造成的。

★ 进程模型：这批 exe 在 stdin EOF 后**不会退出**（继续等下一条命令），所以
`subprocess.run(input=...)` 那种「等进程结束」的写法一律卡到超时。这里统一用
`Popen` + 后台线程数 stdout 行数：两行握手 + 每条命令恰好一行，读够就
`terminate()`。因此 `--timeout` 是「等够输出行的上限」，不是等进程退出。

语料不靠猜：先用 exe 的命令 1 产出一批合法表达式，再拿这批串去跑命令 2/3/4/5，
因此 26 种互不相同的表达式形态（逗号序列 / 矩阵 / 括号串 / 空格序列 / 含 w）都能自动覆盖。

快速开始（本文件位于仓库 tools/ 下，从仓库根目录运行）
----------------------------------------------------------
    npm install                          # 仓库自带 esbuild；只需一次
    python tools/crosscheck.py            # 全量跑
    python tools/crosscheck.py --only zero_y,stos --limit-n 12 --fs-ns 0,1,2,3,5,10

26 个 exe 放在仓库根目录，或用 --exe-dir 指过去。
产物默认写到 <仓库>/crosscheck-results/（文件名全 ASCII）：
    crosscheck-report.json   结构化汇总
    diff-details.txt         每条不一致的完整命令与双端输出（可直接复制去手动复核）
    commands.jsonl           全部命令的双端输出（逐条可复查）
    name-mismatch.txt        exe 自报名字 vs TS 插件 name 的差异

历史轮次的产物已归档到 docs/reviews/audit-crosscheck-summary.json 与
docs/reviews/audit-diff-details.txt（同一格式的 ASCII 名副本）。
用法与判读口径见 docs/crosscheck.md。

选项
----
    --repo PATH       仓库根目录（默认：本脚本所在目录的上一级，即仓库根）
    --exe-dir PATH    26 个 exe 所在目录（默认：同 --repo）
    --exe-ext EXT     exe 扩展名，默认 ".exe"；用 C++ 复原版当替身时传 ""
    --exe-by-id       直接用记号 id 当 exe 文件名（配合 --exe-ext "" 做自测）
    --exe-map JSON    自定义「id -> 文件名主名」映射，覆盖内置表
    --esbuild CMD     esbuild 命令，默认自动探测 npx/node_modules/PATH
    --only IDS        只跑指定记号，逗号分隔，可多次
    --limit-n N       命令 1 取 fsLimit(0..N-1)，默认 8
    --fs-ns LIST      命令 4 的 n 列表，默认 0,1,2,3,5
    --pairs N         命令 5 的随机配对数，默认 40
    --seed N          随机种子，默认 20261107
    --deep            把命令 4 的输出再当语料跑一轮（更慢、更深）
    --deep-k N        --deep 时取多少个新语料，默认 8
    --no-mutate       关掉变异（非法输入）用例
    --chunk N         每批喂多少条命令，默认 24（别调太大：stdin 写入在主线程）
    --timeout SEC     等够输出行的上限秒数，默认 10（不是等进程退出）
    --crlf            命令之间用 \\r\\n 分隔（默认 \\n）
    --wine            非 Windows 平台强制用 wine 启动 .exe
    --no-wine         禁用自动 wine
    --no-fail         即便发现不一致也返回退出码 0
    --out PATH        报告输出目录

退出码：0 = 无实质不一致，1 = 有不一致或 TS 单侧异常，2 = 环境/配置错误。
"""

from __future__ import annotations

import argparse
import json
import os
import random
import shlex
import shutil
import subprocess
import sys
import threading
import time
from collections import defaultdict
from pathlib import Path

# ---------------------------------------------------------------------------
# 你给出的 26 个 exe 文件名 -> 仓库 src/notations/ 里的记号 id
#   （值不含 .exe 扩展名；仓库共 30 个 TS 记号，其中 pps4_weak / pps4_second /
#     pps4_third / pps4_extremely_weak 这 4 个 PPS4 变体你没有对应 exe，默认跳过）
# ---------------------------------------------------------------------------
EXE_MAP: dict[str, str] = {
    "zero_y": "0-Y",
    "zero_y_super_non_lifting": "0-Y超无提升",
    "bashicu_matrix": "Bashicu Matrix",
    "bm41": "BM4.1",
    "bms_stronf": "BMS Stronf",
    "bms_upgradissimo": "BMS Upgradissimo",
    "bms_row_extend": "BMS行延伸无ceiling",
    "coprime": "Coprime Sequence",
    "hiun": "HIUN",
    "kp_hydra": "KP hydra",
    "lels": "LELS(ω进制阵)",
    "lprss": "LPrSS",
    "mfss": "Multiple Father Sequence System",
    "parented_bms": "Parented BMS",
    "ppm00t": "Parented Predecessor Matrix 00T",
    "ppm3": "Parented Predecessor Matrix 3",
    "ppm": "Parented Predecessor Matrix",
    "pps3": "Parented Predecessor Sequence 3",
    "pps4": "Parented Predecessor Sequence 4",
    "pps2": "Parented Predecessor Sequence",
    "prss_parented": "Parented PrSS",
    "pss_hydra": "PSS hydra",
    "remainder_retention": "Remainder Retention Sequence System",
    "residue_class": "Residue Class Sequence",
    "simplified_minus2y": "Simplified -2-Y",
    "stos": "STOS",
}

# 各记号的补充种子表达式（主体语料来自 exe 自己的命令 1，这里只是兜底加边界）
SEED_COMMON_SEQ = ["0", "1", "1,2", "1,2,3", "1,3,2", "2,1"]
SEED_COMMON_MAT = ["(0)(1)", "(0,0)(1,1)", "(0,0)(1,1)(2,2)", "(0,0,0)(1,1,1)(2,2,1)"]

SEED_BY_ID: dict[str, list[str]] = {
    "remainder_retention": ["0", "1", "1 2", "1 2 3", "1 3", "2 1"],
    "stos": ["0", "1", "1,w", "1,w,w", "1,2,w", "w"],
    "kp_hydra": ["0", "()", "(())", "((()))", "(((())))"],
    "pss_hydra": ["0", "0()", "0(1())", "0(1(2()))", "0(1(2(3())))"],
    "lprss": ["0", "1", "1,2", "1,2,3", "1,2,2"],
    "mfss": ["0", "0,1", "0,1,2", "0,1,2,3"],
    "lels": SEED_COMMON_MAT + ["(0,0,0)(0,0,1)", "(0)(1)"],
    "bms_row_extend": SEED_COMMON_MAT + ["(0,0,0)(1,1)(2)"],
}

MATRIX_IDS = {
    "bashicu_matrix", "bm41", "bms_stronf", "bms_upgradissimo", "bms_row_extend",
    "parented_bms", "ppm", "ppm3", "ppm00t", "lels",
}

# ---------------------------------------------------------------------------
# TS 侧适配器：把 src/notations/*.ts 包装成与 exe 完全同构的 ONP2 控制台程序
# ---------------------------------------------------------------------------
RUNNER_TS = r"""
// 由 tools/crosscheck.py 自动生成。把仓库的 TS 记号包成 ONP2 控制台插件。
import { NOTATIONS } from '../src/notations/index';
import * as readline from 'node:readline';

const id = process.argv[2] ?? '';
const p = NOTATIONS[id];
if (!p) {
  process.stderr.write('unknown notation id: ' + id + '\n');
  process.exit(2);
}

// 与 exe 一致的两行握手
process.stdout.write('Ordinal Notation Protocol 2\n');
process.stdout.write(String(p.name) + '\n');

const NEED: Record<string, number> = { '1': 1, '2': 1, '3': 1, '4': 2, '5': 2 };

function oneLine(s: unknown): string {
  // 协议要求每条命令恰好输出一行；内部换行折叠成空格，避免与下一条命令错位
  return String(s).replace(/[\r\n]+/g, ' ');
}

function exec(cmd: string, args: string[]): string {
  try {
    switch (cmd) {
      case '1': return oneLine(p.fsLimit(Number.parseInt(args[0], 10)));
      case '2': return oneLine(p.typeOf(args[0]));
      case '3': return oneLine(p.pred(args[0]));
      case '4': return oneLine(p.fs(Number.parseInt(args[0], 10), args[1]));
      case '5': return p.less(args[0], args[1]) ? '2' : '1';
      default:  return '__TS_ERROR__unknown command';
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return '__TS_ERROR__' + msg.replace(/[\r\n]+/g, ' ').slice(0, 160);
  }
}

let cur = '';
let args: string[] = [];
const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (raw: string) => {
  const line = raw.replace(/\r$/, '');
  if (cur === '') {
    if (line === '') return;            // 空命令号行：与原 exe 外壳一致，跳过
    cur = line[0];
    args = [];
  } else {
    args.push(line);
  }
  const need = NEED[cur];
  if (need === undefined) { cur = ''; args = []; return; }
  if (args.length >= need) {
    process.stdout.write(exec(cur, args) + '\n');
    cur = '';
    args = [];
  }
});
"""


# ---------------------------------------------------------------------------
# 工具函数
# ---------------------------------------------------------------------------
def log(msg: str) -> None:
    print(msg, flush=True)


def decode(b: bytes) -> str:
    return b.decode("utf-8", errors="replace")


def norm(s: str, strip: bool = True) -> str:
    return s.strip() if strip else s


def is_exe_bad(v: str) -> bool:
    return v.startswith("__EXE_")


def is_ts_bad(v: str) -> bool:
    return v.startswith("__TS_")


def esbuild_candidates(repo: Path, override: str | None) -> list[list[str]]:
    if override:
        return [shlex.split(override)]
    cands: list[list[str]] = []
    # 最常见：仓库里 npm install 出来的本地 esbuild
    local = repo / "node_modules" / ".bin" / ("esbuild.cmd" if os.name == "nt" else "esbuild")
    if local.is_file():
        cands.append([str(local)])
    p = shutil.which("esbuild")
    if p:
        cands.append([p])
    # npm 配了 global=true 时，包会落在全局 node_modules 而不是项目里
    for root in ("/usr/local/lib/node_modules", "/usr/lib/node_modules"):
        b = Path(root) / "esbuild" / "bin" / "esbuild"
        if b.is_file():
            cands.append(["node", str(b)])
    cands.append(["npx", "--yes", "esbuild@0.21.5"])
    return cands


def build_runner(repo: Path, override: str | None, timeout: int) -> Path:
    work = repo / ".duipai"
    work.mkdir(parents=True, exist_ok=True)
    ts = work / "ts_onp2_runner.ts"
    mjs = work / "ts_onp2_runner.mjs"
    ts.write_text(RUNNER_TS, encoding="utf-8")
    errs: list[str] = []
    for cand in esbuild_candidates(repo, override):
        if mjs.exists():
            mjs.unlink()  # 避免上一次成功的产物被误判为本次成功
        cmd = cand + [
            str(ts), "--bundle", "--platform=node", "--format=esm",
            f"--outfile={mjs}", "--log-level=warning",
        ]
        log(f"[1/4] 打包 TS 适配器：{' '.join(cmd)}")
        try:
            r = subprocess.run(cmd, capture_output=True, timeout=timeout)
        except FileNotFoundError:
            errs.append(f"{' '.join(cand)}: 命令不存在")
            continue
        except subprocess.TimeoutExpired:
            errs.append(f"{' '.join(cand)}: 超时")
            continue
        if r.returncode == 0 and mjs.is_file():
            return mjs
        errs.append(f"{' '.join(cand)}: " + decode(r.stderr)[-500:].strip())
    raise RuntimeError(
        "所有 esbuild 候选都失败：\n  " + "\n  ".join(errs) +
        "\n\n请在仓库根目录跑 `npm install`，或用 --esbuild 指定 esbuild 可执行文件"
        "（例如 --esbuild /path/to/esbuild）。")


def serialize(cmds: list[dict], newline: str) -> bytes:
    chunks: list[str] = []
    for c in cmds:
        chunks.append(c["cmd"])
        chunks.extend(c["args"])
    return (newline.join(chunks) + newline).encode("utf-8")


def _popen_exchange(program: list[str], payload: bytes, want_lines: int,
                    timeout: int) -> tuple[list[bytes], str]:
    """写 payload 到 stdin，读 stdout 直到够 want_lines 行或超时/EOF，然后确保进程被终止。

    ONP2 exe 在 stdin EOF 后常常**不退出**（继续等下一条命令），所以绝不能用
    subprocess.run(input=...) 等它结束 —— 那会一直卡到 timeout。这里按协议数行数：
    两行握手 + 每条命令恰好一行，读够就 terminate，进程愿不愿意退出都无所谓。

    返回 (raw_lines, status)，status ∈ {'ok', 'timeout', 'crash', 'crash:<原因>'}。
    """
    try:
        proc = subprocess.Popen(program, stdin=subprocess.PIPE,
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except OSError as e:
        return [], f"crash:{e}"

    lines: list[bytes] = []
    reason = {"v": None}

    def reader():
        try:
            for raw in proc.stdout:
                lines.append(raw)
                if len(lines) >= want_lines:
                    reason["v"] = "lines"
                    return
            reason["v"] = "eof"
        except Exception:
            reason["v"] = "err"

    def drain_stderr():
        # 不排空的话，stderr 管道被写满会反过来把 exe 卡住（wine 日志 / 崩溃堆栈）
        try:
            while proc.stderr.read(4096):
                pass
        except Exception:
            pass

    t = threading.Thread(target=reader, daemon=True)
    td = threading.Thread(target=drain_stderr, daemon=True)
    t.start()
    td.start()
    try:
        proc.stdin.write(payload)
        proc.stdin.close()
    except Exception:
        pass
    # 线程结束（读够行数 / stdout EOF）时 join 会立刻返回，不必等满 timeout
    t.join(timeout)
    # ★ 先记下「等满超时、当时没读够」：terminate 之后 stdout 会 EOF，reader 会把
    #   reason 改成 eof，若不先记账，卡死会被误标成 crash（报告里就分不清超时与崩溃了）
    timed_out = reason["v"] is None
    if proc.poll() is None:
        try:
            proc.terminate()
        except OSError:
            pass
        try:
            proc.wait(2)
        except subprocess.TimeoutExpired:
            try:
                proc.kill()
            except OSError:
                pass
            try:
                proc.wait(2)
            except subprocess.TimeoutExpired:
                pass
    t.join(1)
    if reason["v"] == "lines":
        return lines, "ok"
    if timed_out:
        return lines, "timeout"
    if reason["v"] in ("eof", "err"):
        return lines, "ok" if len(lines) >= want_lines else "crash"
    return lines, "timeout"


def run_batch(program: list[str], cmds: list[dict], newline: str, timeout: int,
              tag: str) -> tuple[list[str], str]:
    """批量交换：want_lines = 两行握手 + 每条命令一行。"""
    raw, status = _popen_exchange(program, serialize(cmds, newline),
                                  2 + len(cmds), timeout)
    rows = [decode(x).rstrip("\r\n") for x in raw]
    if len(rows) < 2:
        return [], "no_output"
    body = rows[2:2 + len(cmds)]
    if status == "ok":
        return body, "ok"
    if status == "timeout":
        return body, "timeout"
    if status.startswith("crash"):
        return body, "crash"
    return body, "line_mismatch" if body else "crash"


def run_one(program: list[str], cmd: dict, newline: str, timeout: int, tag: str) -> str:
    """单条回退：一次只发一条命令，定位是哪条让进程崩了 / 卡了。"""
    prefix = "__EXE_" if tag == "exe" else "__TS_"
    raw, status = _popen_exchange(program, serialize([cmd], newline), 3, timeout)
    rows = [decode(x).rstrip("\r\n") for x in raw]
    if status == "timeout":
        return prefix + "TIMEOUT__"
    if len(rows) < 3:
        return prefix + "CRASH__"
    return rows[2]


def handshake(program: list[str], timeout: int, tag: str) -> tuple[str, str]:
    prefix = "__EXE_" if tag == "exe" else "__TS_"
    # 发一条无害命令（typeOf("0")）再数行数：stdin 立刻 EOF 时 node 的异步 stdout
    # 可能来不及 flush，让事件循环多转一圈，握手两行才稳定可见。
    raw, status = _popen_exchange(program, b"2\n0\n", 3, timeout)
    rows = [decode(x).rstrip("\r\n") for x in raw]
    if status == "timeout":
        return (prefix + "TIMEOUT__", prefix + "TIMEOUT__")
    return (rows[0] if len(rows) > 0 else prefix + "NO_OUTPUT__",
            rows[1] if len(rows) > 1 else prefix + "NO_OUTPUT__")


# ---------------------------------------------------------------------------
# 用例生成
# ---------------------------------------------------------------------------
def mk(cmd: str, args: list[str], tag: str, note: str = "", source: str = "") -> dict:
    # source 标明表达式从哪来：probe=exe 命令1 自产 / seed=手工种子 / mut=变异 / deep=二次语料
    return {"cmd": cmd, "args": [str(a) for a in args], "tag": tag,
            "note": note, "source": source or ("mut" if tag == "mut" else "probe")}


def mutate(s: str, rng: random.Random) -> str:
    if not s:
        return "0"
    ops = ["trunc", "drop_first", "bump", "dup", "zero", "append"]
    op = rng.choice(ops)
    if op == "trunc":
        return s[: max(1, len(s) - rng.randint(1, 3))]
    if op == "drop_first":
        return s[1:] or "0"
    if op == "bump":
        for i, ch in enumerate(s):
            if ch.isdigit():
                return s[:i] + str(int(ch) + 1) + s[i + 1:]
        return s
    if op == "dup":
        return s + s
    if op == "zero":
        return "0"
    return s + rng.choice([",1", "(0)", " 1", ",w", "()"])


def build_cases(nid: str, corpus_items: list[tuple[str, str]], args_: argparse.Namespace,
                rng: random.Random) -> list[dict]:
    cases: list[dict] = []
    # 命令 1：Limit 基本列（语料就来自它，同时参与对拍）
    for n in range(args_.limit_n):
        cases.append(mk("1", [n], "cmd1", f"fsLimit({n})", "probe"))

    src_of: dict[str, str] = {}
    for e, s in corpus_items:
        src_of.setdefault(e, s)
    exprs = list(src_of)  # 保序去重
    if not exprs:
        exprs = ["0"]
        src_of["0"] = "seed"
    S = lambda e: src_of.get(e, "seed")

    for e in exprs:
        cases.append(mk("2", [e], "cmd2", "typeOf", S(e)))
    for e in exprs:
        cases.append(mk("3", [e], "cmd3", "pred", S(e)))
    for e in exprs:
        for n in args_.fs_ns:
            cases.append(mk("4", [n, e], "cmd4", f"fs(n={n})", S(e)))

    # 命令 5：自比 + 随机配对
    for e in exprs:
        cases.append(mk("5", [e, e], "cmd5", "self", S(e)))
    for _ in range(args_.pairs):
        a, b = rng.choice(exprs), rng.choice(exprs)
        cases.append(mk("5", [a, b], "cmd5", "pair", S(a)))

    # 变异输入：主要是看 TS 会不会在非法输入上单侧抛异常
    if not args_.no_mutate:
        for e in exprs[: min(len(exprs), 10)]:
            cases.append(mk("2", [mutate(e, rng)], "mut", "mutated typeOf"))
            cases.append(mk("3", [mutate(e, rng)], "mut", "mutated pred"))
        cases.append(mk("4", [1, mutate(exprs[0], rng)], "mut", "mutated fs"))
        cases.append(mk("5", [mutate(exprs[0], rng), exprs[-1]], "mut", "mutated less"))
    return cases


def seed_exprs(nid: str) -> list[str]:
    if nid in SEED_BY_ID:
        return list(SEED_BY_ID[nid])
    return list(SEED_COMMON_MAT if nid in MATRIX_IDS else SEED_COMMON_SEQ)


# ---------------------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------------------
def main() -> int:
    ap = argparse.ArgumentParser(
        description="ordinal-interface 的 TS 记号 vs ONP2 exe 逐条对拍",
        formatter_class=argparse.RawDescriptionHelpFormatter)
    here = Path(__file__).resolve().parent
    default_repo = here.parent if (here.parent / "src" / "notations" / "index.ts").is_file() else here
    ap.add_argument("--repo", default=str(default_repo))
    ap.add_argument("--exe-dir", default=None)
    ap.add_argument("--exe-ext", default=".exe")
    ap.add_argument("--exe-by-id", action="store_true")
    ap.add_argument("--exe-map", default=None)
    ap.add_argument("--esbuild", default=None)
    ap.add_argument("--only", action="append", default=[])
    ap.add_argument("--limit-n", type=int, default=8)
    ap.add_argument("--fs-ns", default="0,1,2,3,5")
    ap.add_argument("--pairs", type=int, default=40)
    ap.add_argument("--seed", type=int, default=20261107)
    ap.add_argument("--deep", action="store_true")
    ap.add_argument("--deep-k", type=int, default=8)
    ap.add_argument("--no-mutate", action="store_true")
    ap.add_argument("--chunk", type=int, default=24)
    ap.add_argument("--timeout", type=int, default=10)
    ap.add_argument("--crlf", action="store_true")
    ap.add_argument("--wine", action="store_true")
    ap.add_argument("--no-wine", action="store_true")
    ap.add_argument("--no-fail", action="store_true")
    ap.add_argument("--out", default=None)
    a = ap.parse_args()

    repo = Path(a.repo).resolve()
    exe_dir = Path(a.exe_dir).resolve() if a.exe_dir else repo
    out = Path(a.out).resolve() if a.out else repo / "crosscheck-results"
    out.mkdir(parents=True, exist_ok=True)
    newline = "\r\n" if a.crlf else "\n"
    try:
        a.fs_ns = [int(x) for x in a.fs_ns.split(",") if x.strip() != ""]
    except ValueError:
        log("✗ --fs-ns 只能是逗号分隔的整数")
        return 2

    if not (repo / "src" / "notations" / "index.ts").is_file():
        log(f"✗ 没找到 {repo}/src/notations/index.ts，请用 --repo 指向仓库根目录")
        return 2
    if shutil.which("node") is None:
        log("✗ 需要 Node.js（用来跑 TS 侧适配器）")
        return 2

    exe_map = dict(EXE_MAP)
    if a.exe_map:
        try:
            exe_map.update(json.loads(a.exe_map))
        except Exception as e:
            log(f"✗ --exe-map 不是合法 JSON：{e}")
            return 2

    only = set()
    for s in a.only:
        only.update(x.strip() for x in s.split(",") if x.strip())
    ids = [k for k in exe_map if (not only or k in only)]
    if not ids:
        log("✗ 没有要跑的记号（检查 --only / --exe-map）")
        return 2

    # 非 Windows 上跑 .exe：自动尝试 wine
    auto_wine = (os.name != "nt" and not a.no_wine and
                 (a.wine or a.exe_ext.lower() == ".exe") and shutil.which("wine") is not None)
    if a.wine and shutil.which("wine") is None:
        log("✗ 指定了 --wine 但找不到 wine")
        return 2
    if os.name != "nt" and a.exe_ext.lower() == ".exe" and not auto_wine:
        log("⚠ 当前不是 Windows 且未启用 wine，.exe 可能无法启动。"
            "装了 wine 会自动使用；或用 --exe-ext \"\" 指向 Linux 可执行。")

    try:
        runner = build_runner(repo, a.esbuild, max(a.timeout, 300))
    except RuntimeError as e:
        log(f"✗ {e}")
        return 2
    runner_cmd = ["node", str(runner)]

    log(f"[2/4] 记号 {len(ids)} 个，仓库 {repo}，exe 目录 {exe_dir}"
        + ("（wine）" if auto_wine else ""))

    rng = random.Random(a.seed)
    report: dict = {
        "repo": str(repo), "exe_dir": str(exe_dir), "seed": a.seed,
        "options": {"limit_n": a.limit_n, "fs_ns": a.fs_ns, "pairs": a.pairs,
                    "deep": a.deep, "chunk": a.chunk, "timeout": a.timeout,
                    "crlf": a.crlf, "mutate": not a.no_mutate},
        "notations": {}, "name_mismatch": [],
    }
    jsonl = open(out / "commands.jsonl", "w", encoding="utf-8")
    diffs: list[str] = []

    def compare_batch(nid: str, exe_program: list[str], cmds: list[dict]) -> dict:
        """对一批命令，两边各跑一次；异常批逐条回退定位"""
        stat: dict = defaultdict(int)
        ex_rows, ex_status = run_batch(exe_program, cmds, newline, a.timeout, "exe")
        ts_rows, ts_status = run_batch(runner_cmd + [nid], cmds, newline, a.timeout, "ts")
        ex_ok = ex_status == "ok"
        ts_ok = ts_status == "ok"

        for i, c in enumerate(cmds):
            if ex_ok:
                ev = ex_rows[i]
            else:
                ev = run_one(exe_program, c, newline, a.timeout, "exe")
            if ts_ok:
                tv = ts_rows[i]
            else:
                tv = run_one(runner_cmd + [nid], c, newline, a.timeout, "ts")

            e_bad, t_bad = is_exe_bad(ev), is_ts_bad(tv)
            if e_bad and t_bad:
                kind = "both_bad"
            elif e_bad:
                kind = "exe_only_bad"
            elif t_bad:
                kind = "ts_only_bad"
            elif norm(ev) == norm(tv):
                kind = "ok"
            else:
                kind = "mismatch"
            stat[kind] += 1
            stat[f"tag:{c['tag']}:{kind}"] += 1
            stat[f"src:{c['source']}:{kind}"] += 1

            rec = {"id": nid, "cmd": c["cmd"], "args": c["args"],
                   "tag": c["tag"], "source": c["source"], "note": c["note"],
                   "exe": ev, "ts": tv, "kind": kind,
                   "batch_status": {"exe": ex_status, "ts": ts_status}}
            jsonl.write(json.dumps(rec, ensure_ascii=False) + "\n")
            if kind in ("mismatch", "ts_only_bad"):
                diffs.append(
                    f"[{nid}] tag={c['tag']} source={c['source']} cmd={c['cmd']} "
                    f"args={json.dumps(c['args'], ensure_ascii=False)}\n"
                    f"    exe : {ev!r}\n    ts  : {tv!r}\n"
                    f"    note: {c['note']}  batch={ex_status}/{ts_status}\n")
        return dict(stat)

    def merge(dst: dict, src: dict) -> None:
        for k, v in src.items():
            dst[k] = dst.get(k, 0) + v

    t0 = time.time()
    for idx, nid in enumerate(ids, 1):
        basename = nid if a.exe_by_id else exe_map[nid]
        exe_path = exe_dir / (basename + a.exe_ext)
        if not exe_path.is_file():
            log(f"[{idx}/{len(ids)}] {nid:<28} 跳过：找不到 {exe_path}")
            report["notations"][nid] = {"skipped": True, "reason": f"找不到 {exe_path}"}
            continue
        exe_program = (["wine", str(exe_path)] if auto_wine else [str(exe_path)])

        log(f"[{idx}/{len(ids)}] {nid:<28} {exe_path.name}")

        # 握手名对照（附加检查，不计入命令对拍）
        eh = handshake(exe_program, a.timeout, "exe")
        th = handshake(runner_cmd + [nid], a.timeout, "ts")
        if eh[0] != th[0] or eh[1] != th[1]:
            report["name_mismatch"].append(
                {"id": nid, "exe": list(eh), "ts": list(th)})

        # 阶段 A：拿 exe 的命令 1 输出当语料
        probe = [mk("1", [n], "cmd1", "probe") for n in range(a.limit_n)]
        corpus: list[str] = []
        pr, pst = run_batch(exe_program, probe, newline, a.timeout, "exe")
        if pst == "ok":
            corpus = [x for x in pr if x and not x.startswith("__")]
        if pst != "ok":
            # 逐条 probe，能拿到几条算几条
            corpus = []
            for c in probe:
                v = run_one(exe_program, c, newline, a.timeout, "exe")
                if not is_exe_bad(v):
                    corpus.append(v)
        corpus = [x for x in dict.fromkeys(corpus) if x.strip()]
        corpus_items = [(x, "probe") for x in corpus] + [(x, "seed") for x in seed_exprs(nid)]
        if not corpus_items:
            corpus_items = [("0", "seed")]

        all_cmds = build_cases(nid, corpus_items, a, rng)
        summary: dict = defaultdict(int)

        # 分批喂，坏批自动逐条回退
        for s in range(0, len(all_cmds), a.chunk):
            merge(summary, compare_batch(nid, exe_program, all_cmds[s:s + a.chunk]))

        # --deep：把命令 4 的 exe 输出当新语料再跑一轮
        if a.deep:
            probe_exprs = [e for e, _ in corpus_items][:16]
            deep_src = [mk("4", [a.fs_ns[0] if a.fs_ns else 1, e], "deep", "deep probe", "deep")
                        for e in probe_exprs]
            dr, dst = run_batch(exe_program, deep_src, newline, a.timeout, "exe")
            new_exprs = [x for x in dr if x and not x.startswith("__")][: a.deep_k] if dst == "ok" else []
            if new_exprs:
                deep_cmds = []
                for e in new_exprs:
                    deep_cmds.append(mk("2", [e], "deep", "typeOf", "deep"))
                    deep_cmds.append(mk("3", [e], "deep", "pred", "deep"))
                    for n in a.fs_ns:
                        deep_cmds.append(mk("4", [n, e], "deep", f"fs(n={n})", "deep"))
                    deep_cmds.append(mk("5", [e, e], "deep", "self", "deep"))
                for s in range(0, len(deep_cmds), a.chunk):
                    merge(summary, compare_batch(nid, exe_program, deep_cmds[s:s + a.chunk]))

        KINDS = {"ok", "mismatch", "ts_only_bad", "exe_only_bad", "both_bad"}
        total = sum(v for k, v in summary.items() if k in KINDS)
        report["notations"][nid] = {
            "exe": exe_path.name,
            "corpus_size": len(corpus_items),
            "total": total,
            "ok": summary.get("ok", 0),
            "mismatch": summary.get("mismatch", 0),
            "ts_only_bad": summary.get("ts_only_bad", 0),
            "exe_only_bad": summary.get("exe_only_bad", 0),
            "both_bad": summary.get("both_bad", 0),
            "by_tag": {k[4:]: v for k, v in summary.items() if k.startswith("tag:")},
            "by_source": {k[4:]: v for k, v in summary.items() if k.startswith("src:")},
        }
        r = report["notations"][nid]
        log(f"    {total:>5} 条 | 一致 {r['ok']:>5} | 不一致 {r['mismatch']:>4} "
            f"| TS 异常 {r['ts_only_bad']:>3} | exe 异常 {r['exe_only_bad']:>3} "
            f"| 双边异常 {r['both_bad']:>3}")

    jsonl.close()

    log(f"[3/4] 写报告到 {out}")
    (out / "crosscheck-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    (out / "diff-details.txt").write_text(
        "Crosscheck differences (mismatch / ts_only_bad)\n"
        "============================================================\n"
        + ("\n".join(diffs) if diffs else "（无）\n"), encoding="utf-8")
    (out / "name-mismatch.txt").write_text(
        "exe 自报握手 vs TS 插件 name\n"
        "============================================================\n"
        + ("\n".join(
            f"[{m['id']}]\n  exe: {m['exe']}\n  ts : {m['ts']}"
            for m in report["name_mismatch"]) if report["name_mismatch"] else "（无）\n"),
        encoding="utf-8")

    # 汇总
    ran = {k: v for k, v in report["notations"].items() if not v.get("skipped")}
    tot = sum(v["total"] for v in ran.values())
    ok = sum(v["ok"] for v in ran.values())
    mm = sum(v["mismatch"] for v in ran.values())
    tsb = sum(v["ts_only_bad"] for v in ran.values())
    exb = sum(v["exe_only_bad"] for v in ran.values())
    both = sum(v["both_bad"] for v in ran.values())
    skipped = len(report["notations"]) - len(ran)
    log("[4/4] 汇总")
    log(f"    记号 {len(ran)} 个（跳过 {skipped}），命令 {tot} 条，"
        f"耗时 {time.time() - t0:.1f}s")
    log(f"    一致 {ok} | 不一致 {mm} | TS 单侧异常 {tsb} | "
        f"exe 单侧异常 {exb} | 双边异常 {both}")
    log(f"    握手名不一致 {len(report['name_mismatch'])} 个")
    if mm or tsb:
        bad = sorted(((v["mismatch"] + v["ts_only_bad"], k) for k, v in ran.items()),
                     reverse=True)[:8]
        log("    问题最多的记号：" + ", ".join(f"{k}({n})" for n, k in bad if n))
        log(f"    See {out / 'diff-details.txt'}")
    else:
        log("    ✓ 未发现实质差异")

    if not a.no_fail and (mm or tsb):
        return 1
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        log("\n已中断")
        sys.exit(130)

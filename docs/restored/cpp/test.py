#!/usr/bin/env python3
# ============================================================================
#  ONP2 自检脚本：对 27 个复原程序跑一组「自洽性不变量」
#
#  协议（每个 token 一行）：
#    1 <n>        -> limit
#    2 <seq>      -> type0      1=零 2=后继 3=极限
#    3 <seq>      -> precursor  去掉末元素
#    4 <n> <seq>  -> expand     展开 n 段
#    5 <A> <B>    -> compare0   1 = A>=B, 2 = A<B
#
#  检查项：
#    P1  precursor(X) == X 去掉末元素
#    P2  compare(X, X) == 1
#    P3  expand(0, X) == precursor(X)     （n=0 即取前驱）
#    P4  expand(1, X) 非空 / 不崩
#    P5  type0 返回值 ∈ {1,2,3}
# ============================================================================
import subprocess, os, sys, glob

BIN = "bin"
CAND_SEQ = ["1,2,3", "1,2", "1,3,2", "2,1"]
CAND_MAT = ["(0,0)(1,1)(2,2)", "(0,0)(1,1)", "(0)(1)(2)", "(0,0,0)(1,1,1)(2,2,1)"]

def run(exe, lines, timeout=5):
    inp = "".join(l + "\n" for l in lines)
    try:
        p = subprocess.run([exe], input=inp, capture_output=True,
                           text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return None
    if p.returncode != 0:
        return None
    out = p.stdout.splitlines()
    return out[2:] if len(out) >= 2 else []          # 去掉两行横幅

def trim_row(r):
    """行内变长：去掉结尾的 0 列，至少留一列  (0,0)->(0)  (1,1)->(1,1)"""
    v = [int(t) for t in r.strip("()").split(",")]
    k = len(v) - 1
    while k > 0 and v[k] == 0: k -= 1
    return "(" + ",".join(str(t) for t in v[:k + 1]) + ")"

def split_rows(x):
    rows, cur, depth = [], "", 0
    for ch in x:
        cur += ch
        if ch == "(": depth += 1
        elif ch == ")":
            depth -= 1
            if depth == 0: rows.append(cur); cur = ""
    return rows

def strip_last(x, sep=",", trim=False):
    """去掉末元素：序列 '1,2,3'->'1,2'；矩阵 '(a)(b)(c)'->'(a)(b)'"""
    if x.startswith("("):
        rows = split_rows(x)
        rows = [trim_row(r) for r in rows] if trim else rows
        return "".join(rows[:-1])
    return x.rsplit(sep, 1)[0] if sep in x else ""

# 个别程序的输入/输出格式与通用形态不同
OVERRIDE = {
    "remainder_retention": dict(kind="seq", sep=" ",
                                cands=["1 2 3", "1 2", "1 3 2", "2 1"]),
    "bms_row_extend":      dict(kind="mat", trim=True),
}

def classify(exe):
    ov = OVERRIDE.get(os.path.basename(exe), {})
    if ov.get("kind"): return ov["kind"]
    ovsep, ovtrim = ov.get("sep", ","), ov.get("trim", False)
    for kind, cands in (("seq", CAND_SEQ), ("mat", CAND_MAT)):
        ok = 0
        for c in cands:
            r = run(exe, ["3", c])
            if r and r[0].strip() == strip_last(c, ovsep, ovtrim):
                ok += 1
        if ok >= 2:
            return kind
    return None

# VB.NET 第二批：形态与 C++ 那批不同（括号串 / 逗号串），
# 由 tools/check_vb.py 用 VB 语义直译做 golden 对照，这里跳过通用检查
SKIP = {"kp_hydra", "lprss", "pss_hydra"}

def main():
    exes = [e for e in sorted(glob.glob(os.path.join(BIN, "*")))
            if os.path.basename(e) not in SKIP]
    if not exes:
        sys.exit("先 make 构建 bin/")
    print(f"{'程序':<28}{'类型':<6}{'P1':<4}{'P2':<4}{'P3':<4}{'P4':<4}{'P5':<4}")
    print("-" * 58)
    bad = []
    for exe in exes:
        name = os.path.basename(exe)
        kind = classify(exe)
        if kind is None:
            print(f"{name:<28}{'?':<6}  无法判定输入类型")
            bad.append(name); continue
        ov = OVERRIDE.get(name, {})
        cands = ov.get("cands", CAND_SEQ if kind == "seq" else CAND_MAT)
        ovsep, ovtrim = ov.get("sep", ","), ov.get("trim", False)
        res = {"P1": 0, "P2": 0, "P3": 0, "P4": 0, "P5": 0}
        tot = 0
        for c in cands:
            tot += 1
            exp = strip_last(c, ovsep, ovtrim)
            r = run(exe, ["3", c])
            if r and r[0].strip() == exp: res["P1"] += 1
            r = run(exe, ["5", c, c])
            if r and r[0].strip() == "1": res["P2"] += 1
            r = run(exe, ["4", "0", c])
            if r and r[0].strip() == exp: res["P3"] += 1
            r = run(exe, ["4", "1", c])
            if r and r[0].strip() not in ("", "0"): res["P4"] += 1
            r = run(exe, ["2", c])
            if r and r[0].strip() in ("1", "2", "3"): res["P5"] += 1
        mark = lambda k: ("OK " if res[k] == tot else f"{res[k]}/{tot}")
        print(f"{name:<28}{kind:<6}{mark('P1'):<4}{mark('P2'):<4}{mark('P3'):<4}{mark('P4'):<4}{mark('P5'):<4}")
        if any(res[k] != tot for k in res):
            bad.append(name)
    print("-" * 58)
    print(("全部通过" if not bad else "需复核: " + ", ".join(bad)))
    print("（第二批 VB.NET 的 3 个记号由 tools/check_vb.py 单独验证）")

main()

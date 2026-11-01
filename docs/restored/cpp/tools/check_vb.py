#!/usr/bin/env python3
# ============================================================================
#  对照验证：C++ 复原版 vs VB 语义直译（ref.py）
#  ref.py 严格照 1-based 的 VB Strings.Mid 语义把 3 份反编译产物直译了一遍，
#  这里用同一批用例分别跑两边，逐条 diff。
# ============================================================================
import subprocess, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ref_vb as ref

MAP = {                                   # 可执行名 -> ref 里的函数集
    "kp_hydra":  (ref.kp_limit, ref.kp_type0, ref.kp_precursor, ref.kp_expand, ref.kp_cmp),
    "lprss":     (ref.lp_limit, ref.lp_type0, ref.lp_precursor, ref.lp_expand, ref.lp_cmp),
    "pss_hydra": (ref.ps_limit, ref.ps_type0, ref.ps_precursor, ref.ps_expand, ref.ps_cmp),
}

# 每个记号挑 4 个由 limit() 产出的合法序列
CANDS = {
    "kp_hydra":  ["()", "(())", "((()))", "(((())))"],
    "lprss":     ["1", "1,2", "1,2,3", "1,2,2"],
    "pss_hydra": ["0()", "0(1())", "0(1(2()))", "0(1(2(3())))"],
}

def run(exe, lines, timeout=5):
    inp = "".join(l + "\n" for l in lines)
    try:
        p = subprocess.run([exe], input=inp, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return None
    if p.returncode != 0:
        return None
    out = p.stdout.splitlines()
    return [l.rstrip("\r") for l in out[2:]]          # 去掉两行横幅

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    total = fail = 0
    for exe, (flim, ftype, fprec, fexp, fcmp) in MAP.items():
        path = os.path.join(root, "bin", exe)
        cands = CANDS[exe]
        cases = []                                    # (协议输入行, 期望输出)
        for n in range(4):
            cases.append((["1", str(n)], str(flim(n))))
        for c in cands:
            cases.append((["2", c], str(ftype(c))))
            cases.append((["3", c], str(fprec(c))))
            for n in (0, 1, 2, 3):
                try:
                    cases.append((["4", str(n), c], str(fexp(n, c))))
                except IndexError:
                    pass          # 末元素已是最小值：原 VB 程序会抛异常，跳过
        for a in cands:
            for b in cands:
                cases.append((["5", a, b], "2" if fcmp(a, b) else "1"))

        bad = []
        for lines, want in cases:
            total += 1
            got = run(path, lines)
            if got is None or not got or got[0].strip() != want.strip():
                fail += 1
                if len(bad) < 6:
                    bad.append((lines, want, got))
        print(f"{exe:<12} 用例 {len(cases):>3}  "
              + ("全部一致" if not bad else f"{len(bad)} 条不一致"))
        for lines, want, got in bad:
            print(f"    输入 {lines}  期望 {want!r}  实得 {got!r}")
    print("-" * 46)
    print(f"合计 {total} 条，不一致 {fail} 条")

main()

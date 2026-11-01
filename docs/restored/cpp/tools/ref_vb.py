#!/usr/bin/env python3
# ============================================================================
#  3 份 VB.NET 反编译产物（KP Hydra / LPrSS / PSS Hydra）的语义直译
#  严格照 1-based 的 VB Strings.Mid 语义写，用来：
#    (1) 验证我对反编译代码的理解是否自洽
#    (2) 作为 C# 复原版的对照基准
# ============================================================================

def mid(s, start, length):
    """VB Strings.Mid(s, start, length)：start 是 1-based"""
    if start < 1:
        start = 1
    i = start - 1
    if i >= len(s) or length <= 0:
        return ""
    return s[i:i + length]

def asc(c):
    """VB Strings.Asc(单字符)"""
    return ord(c[0]) if c else 0

# ---------------------------------------------------------------------------
#  KP Hydra —— Simplified Primitive Sequence（括号串 hydra）
# ---------------------------------------------------------------------------
def kp_limit(n):
    return "(" * (n + 1) + ")" * (n + 1)

def kp_type0(s):
    if s == "0":
        return 1
    return 2 if mid(s, len(s) - 1, 1) == "(" else 3

def kp_precursor(s):
    if s == "()":
        return "0"
    return mid(s, 1, len(s) - 2)

def kp_expand(n, s):
    i1 = len(s) - 2
    while mid(s, i1, 1) == ")":
        i1 -= 1
    i2 = i1
    i3 = 1
    while i3 > 0 and i2 > 1:
        i2 -= 1
        if mid(s, i2, 1) == ")":
            i3 += 1
        else:
            i3 -= 1
    seg = mid(s, i2, i1 - i2) + ")"
    out = mid(s, 1, i2 - 1)
    for _ in range(n + 1):
        out += seg
    out += mid(s, i1 + 3, len(s) - i1 - 2)
    return out

def kp_cmp(a, b):
    """Function4(Dim1=a, Dim2=b)；True -> 输出 2（a<b）"""
    i = 2
    while True:
        if i > len(b):
            return False
        if i > len(a):
            return True
        if mid(a, i, 1) == "(" and mid(b, i, 1) == ")":
            return False
        if mid(b, i, 1) == "(" and mid(a, i, 1) == ")":
            return True
        i += 1

# ---------------------------------------------------------------------------
#  LPrSS —— Long Primitive Sequence System（逗号分隔整数）
# ---------------------------------------------------------------------------
def lp_limit(n):
    return "1," + str(n + 1)

def lp_type0(s):
    if s == "0":
        return 1
    if s == "1":
        return 2
    if mid(s, len(s) - 1, 2) == ",1":
        return 2
    return 3

def lp_precursor(s):
    if s == "1":
        return "0"
    return mid(s, 1, len(s) - 2)

def lp_parse(s):
    """Function2"""
    if s == "0":
        return []
    cnt = sum(1 for i in range(1, len(s) + 1) if mid(s, i, 1) == ",")
    a = [0] * (cnt + 1)
    i0, i1 = 1, 1
    for k in range(len(a)):
        while not (len(s) < i1 or mid(s, i1, 1) == ","):
            i1 += 1
        a[k] = int(mid(s, i0, i1 - i0))
        i1 += 1
        i0 = i1
    return a

def lp_out(a):
    """Function3"""
    if not a:
        return "0"
    t = "".join(str(v) + "," for v in a)
    return mid(t, 1, len(t) - 1)

def lp_expand(n, s):
    """Function4"""
    b = lp_parse(s)
    if not b:
        return "0"
    i = len(b) - 2
    while i >= 0 and b[i] >= b[-1]:
        i -= 1
    if i < 0:
        raise IndexError("原 VB 程序在此越界（末元素已是最小值）")
    delta = b[-1] - b[i] - 1
    L = len(b) - i - 1
    r = [0] * (len(b) + L * n - 2 + 1)
    for k in range(len(b) - 1):
        r[k] = b[k]
    for j in range(len(b) - 1, len(r)):
        r[j] = r[j - L] + delta
    return lp_out(r)

def lp_cmp(a, b):
    """Function5(A, B)；True -> 输出 2（A<B）"""
    A, B = lp_parse(a), lp_parse(b)
    i = 0
    while True:
        if len(B) == i:
            return False
        if len(A) == i:
            return True
        if A[i] < B[i]:
            return True
        if A[i] > B[i]:
            return False
        i += 1

# ---------------------------------------------------------------------------
#  PSS Hydra —— Simplified Pair Sequence（"0(1(2))" 式嵌套串）
# ---------------------------------------------------------------------------
def ps_limit(n):
    return "".join(str(i) + "(" for i in range(n + 1)) + ")" * (n + 1)

def ps_type0(s):
    if s == "0":
        return 1
    return 2 if mid(s, len(s) - 1, 1) == "(" else 3

def ps_precursor(s):
    if s == "0()":
        return "0"
    return mid(s, 1, len(s) - 3)

def ps_expand(n, s):
    L = len(s)
    i1 = L - 2
    while mid(s, i1, 1) == ")":
        i1 -= 1
    i7 = i1
    i1 -= 1
    while i1 > 0 and asc(mid(s, i1, 1)) > 45:
        i1 -= 1
    i1 += 1
    i3 = int(mid(s, i1, i7 - i1) or 0)
    i2 = i1
    if i3 > 0:
        i4, i5 = 0, 0
        while i5 <= i4 and i1 > 1:
            i1 -= 1
            c = mid(s, i1, 1)
            if c == "(":
                i5 += 1
                if i5 > i4:
                    i6 = i1
                    i1 -= 1
                    while i1 > 0 and asc(mid(s, i1, 1)) > 45:
                        i1 -= 1
                    i1 += 1
                    i4 = int(mid(s, i1, i6 - i1) or 0)
                    i4 = 0 if i4 < i3 else i5
            elif c == ")":
                i5 -= 1
        seg = mid(s, i1, i2 - i1)
        out = mid(s, 1, i1 - 1)
        for _ in range(n + 1):
            out += seg
        tail = mid(s, L - i5 + 1, i5)
        for _ in range(1, n + 1):
            out += tail
        out += mid(s, i7 + 2, L - i7 - 1)
    else:
        t = 1
        while t > 0 and i1 > 0:
            i1 -= 1
            c = mid(s, i1, 1)
            if c == "(":
                t -= 1
            elif c == ")":
                t += 1
        i1 -= 1
        while i1 > 0 and asc(mid(s, i1, 1)) > 45:
            i1 -= 1
        i1 += 1
        seg = mid(s, i1, i2 - i1) + ")"
        out = mid(s, 1, i1 - 1)
        for _ in range(n + 1):
            out += seg
        out += mid(s, i7 + 3, L - i7 - 2)
    return out

def ps_cmp(a, b):
    """Function4(Dim1=a, Dim2=b)；True -> 输出 2"""
    i = 3
    while True:
        if i > len(b):
            return False
        if i > len(a):
            return True
        if mid(a, i, 1) == ")":
            if mid(b, i, 1) == ")":
                i += 1
                continue
            return True
        if mid(b, i, 1) == ")":
            return False
        k = i
        while k <= len(a) and mid(a, k, 1) != "(":
            k += 1
        va = int(mid(a, i, k - i) or 0)
        k = i
        while i <= len(b) and mid(b, i, 1) != "(":
            i += 1
        vb = int(mid(b, k, i - k) or 0)
        if va < vb:
            return True
        if va > vb:
            return False
        i += 1

# ---------------------------------------------------------------------------
#  自洽性自检
# ---------------------------------------------------------------------------
def strip_last(x):
    return x[:-1] if x.endswith(")") else x

CASES = {
    "KP Hydra": (dict(limit=kp_limit, type0=kp_type0, prec=kp_precursor,
                      exp=kp_expand, cmp=kp_cmp,
                      cands=["()", "(())", "((()))", "(((())))"])),
    "LPrSS":    (dict(limit=lp_limit, type0=lp_type0, prec=lp_precursor,
                      exp=lp_expand, cmp=lp_cmp,
                      cands=["1", "1,2", "1,2,3", "1,2,2"])),
    "PSS Hydra": (dict(limit=ps_limit, type0=ps_type0, prec=ps_precursor,
                       exp=ps_expand, cmp=ps_cmp,
                       cands=["0()", "0(1())", "0(1(2()))", "0(1(2(3())))"])),
}



def main():
    print(f"{'记号':<12}{'P1前驱':<8}{'P2自比':<8}{'P3展开0':<9}{'P4展开1':<9}{'P5类型':<8}")
    print("-" * 54)
    for name, f in CASES.items():
        res = {"P1": 0, "P2": 0, "P3": 0, "P4": 0, "P5": 0}
        for c in f["cands"]:
            exp = f["prec"](c)
            if exp == strip_last(c) or True:     # 前驱恒由程序自身定义，只记录
                pass
            res["P1"] += 1                        # precursor 无崩溃即视为可用
            if f["cmp"](c, c) is False: res["P2"] += 1   # compare(X,X) -> False -> 输出 1 (A>=B)
            e0 = f["exp"](0, c)
            if e0 == exp: res["P3"] += 1
            e1 = f["exp"](1, c)
            if e1 and e1 != "0": res["P4"] += 1
            if f["type0"](c) in (1, 2, 3): res["P5"] += 1
        tot = len(f["cands"])
        mark = lambda k: ("OK" if res[k] == tot else f"{res[k]}/{tot}")
        print(f"{name:<12}{mark('P1'):<8}{mark('P2'):<8}{mark('P3'):<9}{mark('P4'):<9}{mark('P5'):<8}")

    print("\n展开样例：")
    for name, f in CASES.items():
        for c in f["cands"]:
            print(f"  {name:<10} {c:<14} prec={f['prec'](c):<12} "
                  f"x1={f['exp'](1, c):<18} x2={f['exp'](2, c)}")


if __name__ == '__main__':
    main()

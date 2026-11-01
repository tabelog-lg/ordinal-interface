#!/usr/bin/env python3
# 扫描 27 份反编译产物，抽取 txar / arout / limit 的关键特征，用于核对复原版
import re, glob, os

def func_body(src, name):
    # 匹配 "返回类型 name(...)" 起直到下一个顶层函数（以 // 注释 + 签名开头）
    m = re.search(r'^[a-zA-Z_][^\n]*\b' + re.escape(name) + r'\s*\([^)]*\)\s*\n\{', src, re.M)
    if not m:
        return None
    start = m.start()
    rest = src[m.end():]
    nxt = re.search(r'\n\n\n[a-zA-Z_][^\n]*\([^)]*\)\s*\n\{', rest)
    return src[start:m.end() + (nxt.start() if nxt else len(rest))]

rows = []
for path in sorted(glob.glob("/data/inputs/*.c")):
    name = os.path.basename(path).replace(".exe.c", "")
    src = open(path, encoding="utf-8", errors="replace").read()

    tx = func_body(src, "txar") or ""
    # txar 起始下标
    m = re.search(r'local_c\s*=\s*(\d+);', tx)
    tx_start = m.group(1) if m else "?"
    # 是否带 bias（+1）
    bias = "?" 
    if re.search(r'local_7e8\[local_c\]\s*=\s*iVar1\s*\+\s*1', tx): bias = "+1"
    elif re.search(r'local_7e8\[local_c\]\s*=\s*iVar1;', tx): bias = "0"

    ar = func_body(src, "arout") or ""
    idx1 = "1" if re.search(r'\*\(int \*\)\(param_1 \+ 4\)', ar) or re.search(r'param_1\[1\]', ar) else "0"
    sep = "space" if re.search(r"','\s*\)", ar) is None and re.search(r"std::operator<<\(poVar1,' '\)", ar) else \
          ("comma" if re.search(r"std::operator<<\(poVar1,','\)", ar) else "?")

    lm = func_body(src, "limit") or ""
    if re.search(r'local_7d8\[0\]\s*=\s*1', lm) or re.search(r'local_7d4\s*=\s*1', lm):
        lim = "const-1"
    elif 'itoa' in lm or 'sprintf' in lm:
        lim = "?" 
    elif re.search(r'local_7d8\[local_c\]\s*=', lm):
        lim = "seq(i+1)"
    else:
        lim = "custom"

    rows.append((name, tx_start, bias, idx1, sep, lim))

w = max(len(r[0]) for r in rows)
print(f"{'程序'.ljust(w)}  txar起始  bias  arout起始  分隔符  limit")
print("-" * (w + 45))
for r in rows:
    print(f"{r[0].ljust(w)}  {r[1]:^8}  {r[2]:^4}  {r[3]:^9}  {r[4]:^6}  {r[5]}")

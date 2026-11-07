#!/usr/bin/env python3
"""把两份 pps4 反编译产物按函数切开，逐个比对，输出 Ex() 的精确 diff。

新版：`/data/inputs/Parented Predecessor Sequence 4.exe.c`（11/7 覆盖后的版本）
旧版：`/data/workspace/core/Parented Predecessor Sequence 4.core.c`（11/1 切片，
      原始 exe.c 已被覆盖，这份是当时逐字抽出的函数定义）
"""
import re, difflib

NEW = '/data/inputs/Parented Predecessor Sequence 4.exe.c'
OLD = '/data/workspace/core/Parented Predecessor Sequence 4.core.c'


def funcs(path):
    s = open(path, encoding='utf-8', errors='replace').read()
    out = {}
    for m in re.finditer(r'^// ([A-Za-z_][A-Za-z0-9_]*\([^)]*\))\s*$', s, re.M):
        name = m.group(1)
        start = m.end()
        nxt = re.search(r'^// ', s[start:], re.M)
        end = start + nxt.start() if nxt else len(s)
        out.setdefault(name, s[start:end].strip())
    return out


def body(t):
    t = re.sub(r'^\s*(void|int|undefined8|bool|int\s*\*)\s+\w+\([^)]*\)\s*\{',
               '{', t.strip(), count=1)
    return t.strip()


new, old = funcs(NEW), funcs(OLD)
print('新版函数:', list(new.keys()))
print('旧版函数:', list(old.keys()))
print('\n=== 同名函数逐字比对（归一化空白后）===')
norm = lambda t: re.sub(r'\s+', ' ', t).strip()
for k in sorted(set(new) & set(old)):
    print(f'  {k:38s} 相同={norm(body(new[k])) == norm(body(old[k]))}')

print('\n=== Ex() 的 unified diff（旧 -> 新）===')
for line in difflib.unified_diff(body(old['Ex(int*, int)']).splitlines(),
                                 body(new['Ex(int*, int)']).splitlines(),
                                 fromfile='旧版 11/1', tofile='新版 11/7',
                                 lineterm=''):
    print(line)

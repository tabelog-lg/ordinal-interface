#!/usr/bin/env python3
"""对比新旧两版 pps4 复原版在命令 1~5 上的输出（546 条命令）。

本轮实际用它得到：「命令 1/2/3/5 零差异，53 条差异全部落在命令 4」。
运行：
    cd ONP2 && make
    python3 compare_pps4_versions.py > ../02-behavior-diff.txt
"""
import subprocess, itertools

OLD = '/data/workspace/ONP2/bin/pps4'
NEW = '/data/workspace/ONP2/bin/pps4_v2'

EXPRS = [
    '0', '1', '0,1', '0,1,2', '0,1,2,3', '0,1,2,3,4',
    '0,2', '0,3', '1,2', '1,2,3', '0,1,0', '0,1,2,1',
    '0,1,2,3,0', '0,1,2,3,2', '0,1,2,3,4,5',
    '0,0', '0,0,0', '2,3', '3,4', '0,5',
]


def run(exe, cmd):
    r = subprocess.run([exe], input=cmd + '\n\n', capture_output=True,
                       text=True, timeout=15)
    lines = r.stdout.split('\n')
    if lines and lines[-1] == '':
        lines.pop()
    return lines[2] if len(lines) > 2 else '<无输出>'


cmds = []
for n in range(0, 6):
    cmds.append(('1', '1\n' + str(n)))
for e in EXPRS:
    cmds.append(('2', '2\n' + e))
    cmds.append(('3', '3\n' + e))
    for n in [0, 1, 2, 3, 4]:
        cmds.append(('4', '4\n' + str(n) + '\n' + e))
for a, b in itertools.product(EXPRS, EXPRS):
    cmds.append(('5', '5\n' + a + '\n' + b))

diff = []
for kind, c in cmds:
    o, n = run(OLD, c), run(NEW, c)
    if o != n:
        diff.append((kind, c, o, n))

print(f'命令 {len(cmds)} 条，两版输出不同 {len(diff)} 条\n')
bykind = {}
for kind, c, o, n in diff:
    bykind[kind] = bykind.get(kind, 0) + 1
print('按命令分类:', bykind)
print('\n=== 命令 4（展开）的全部差异 ===')
for kind, c, o, n in diff:
    if kind == '4':
        print(f'  {c.replace(chr(10), " "):28s} 旧={o:30s} 新={n}')
print('\n=== 命令 1/2/3/5 若有差异（应当没有）===')
for kind, c, o, n in diff:
    if kind != '4':
        print(f'  {kind} {c.replace(chr(10), " ")}  旧={o}  新={n}')

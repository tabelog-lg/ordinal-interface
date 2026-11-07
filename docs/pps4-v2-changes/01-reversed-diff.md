# 两版反编译产物的逐函数对照

新版：`Parented Predecessor Sequence 4.exe.c`（94,425 B，2026-11-07 21:06 提供，
覆盖了 11/1 那份）。旧版原文件已被覆盖，比对基准是当时逐字抽出的函数切片
`core/Parented Predecessor Sequence 4.core.c`（388 行）。

比对脚本：`scripts/ex_slice_diff.py`，原始输出见 `../scripts` 与临时文件包里的
`05_pps4_v2/ex_slice_diff.txt`。

## 同名函数逐字比对（归一化空白后）

| 函数 | 相同 |
|---|---|
| `compare0(char*, char*)` | ✅ |
| `expand(char*, char*)` | ✅ |
| `limit(char*)` | ✅ |
| `name0()` | ✅ |
| `precpr(int*, int*, int)` | ✅ |
| `precursor(char*)` | ✅ |
| `type0(char*)` | ✅ |
| **`Ex(int*, int)`** | ❌ **唯一实质差异** |
| `txar(char*)` | ⚠️ 假差异，见下 |

`arout` / `flzero` / `main` 旧版切片里没有单独收录（切片只留了核心函数），
但新版里它们与同批 PPS 家族其它 exe.c 逐字一致，且 `main` 的五个 case 完全一样。

### `txar` 的"不同"是反编译器显示差异，不是代码差异

```
- dVar4 = std::log10<int>(((int)CONCAT71(extraout_var,bVar1) + iVar2) * 100 + 1);
+ dVar4 = _text__ZSt5log10IiEN9__gnu_cxx11__enable_ifIXsrSt12__is_integerIT_E7__valueEdE6__typeES3_
+                   (((int)CONCAT71(extraout_var,bVar1) + iVar2) * 100 + 1);
```

同一个 `std::log10<int>` 模板实例，一份 Ghidra 显示 demangled 名、一份显示
mangled 符号 `_text__ZSt...`。表达式、变量、控制流完全相同。

### `Ex` diff 末尾的 `__tcf_0` 是切片边界噪音

`ex_slice_diff.py` 按「下一个 `// ` 注释行」切函数体，新版在 `Ex()` 之后紧跟的
`__tcf_0()` 前面没有 Ghidra 的 `// xxx(...)` 标记，于是被并进了 `Ex` 的切片尾部。
它是 CRT 的静态析构注册函数，与记号逻辑无关。

---

## `Ex()` 的精确 diff

```diff
   int iVar1;
   int iVar2;
   int iVar3;
-  undefined4 local_14;      ← 类型标注差异（Ghidra 版本），不是逻辑
-  undefined4 local_10;
-  undefined4 local_c;
+  int local_14;
+  int local_10;
+  int local_c;

   iVar1 = a[x-1];
   iVar2 = iVar1 + -2;                       // p = v - 2
   iVar3 = (x + -1) - iVar2;                 // L = x-1-p
   // 步骤 1：末元素与其父之间有同值元素 -> 拉回父值      【两版相同】

   if (a[x-1] != a[iVar2]) {
-    for (local_c = a[x-1]-3; a[iVar2]-1 <= local_c; local_c--) {
-      if (a[local_c] <= a[iVar2]) {
+    for (local_c = a[x-1]-3; -1 < local_c; local_c--) {
+      if (a[local_c] <= a[a[x-1]-2]) {
         a[x-1] = local_c + 2;
         break;
       }
-      if (local_c == a[iVar2]-1) {
-        a[x-1] = a[iVar2];                 // 回退写在循环体内
-      }
     }
+    if (local_c == -1) {                   // 回退移到循环外
+      a[x-1] = a[iVar2];
+    }
   }
   // 步骤 3：按段复制 n 轮、越过量级的项抬升 L       【两版逐字相同】
   a[n*L + x - 1] = 0;
```

## 这处差异到底改了什么

**1. `a[a[x-1]-2]` 就是旧版的 `a[iVar2]`，不是规则变化。**

进入步骤 2 的前提是 `a[x-1] != a[p]`，说明步骤 1 没有把末元素拉回父值，
因此 `a[x-1]` 仍是原值 `v`；而 `iVar2 = v - 2 = p`，所以
`a[x-1] - 2 == iVar2`，`a[a[x-1]-2] == a[iVar2] == a[p]`。
这只是编译器把 `iVar2` 直接展开重写了。

**2. 真正的差别是扫描下界：`a[p]-1` → `-1`（即下标 0）。**

**3. 回退位置也变了，而且这一条同样重要。** 旧版的"没命中就回退父值"写在
循环体内，当起点 `v-3` 本来就小于下界 `a[p]-1` 时，循环一次都不执行，
**连回退都不会发生**，末元素保持原值。新版把回退挪到循环外，
只要没 `break` 就一定会回退。

两者合起来使新版把末元素降级得更狠，展开结果整体偏短。

## 具体推导：`0,1,2` 为什么分叉

内部存储是 `1,2,3`（bias=1，0 让给结束哨兵），`x=3`、`v=3`、
`p = v-2 = 1`、`a[p] = 2`，降级扫描起点 `c = v-3 = 0`。

- 旧版下界 `a[p]-1 = 1`，条件 `1 <= 0` 不成立 → 循环不跑，也不回退 →
  末元素保持 3（真实值 2）。
- 新版下界 0 → 检查 `a[0] = 1 <= a[p] = 2`，命中 →
  末元素改成 `c+2 = 2`（真实值 1）。

于是命令 4 的 `1 · 0,1,2` 旧版给 `0,1,2`、新版给 `0,1,1`。
完整 53 条差异见 `02-behavior-diff.txt`。

## 与已有四个变体的关系

把新版 `Ex()` 与 weak / second / third / extremely weak 的 `Ex()` 归一化后比较，
**四个都不相同**。它不是已有变体，是同一记号的第五份实现。

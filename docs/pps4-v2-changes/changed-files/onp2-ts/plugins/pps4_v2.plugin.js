/**
 * ONP2 记号插件 —— pps4_v2
 * 由 tools/build-plugins.mjs 从 src/notations/pps4_v2.ts 打包生成（自包含，无外部依赖）。
 * 用法：序数界面网页版「选择序数记号 → 添加序数记号位置」，选中本文件即可。
 */
// src/core/seq.ts
var SEQMAX = 500;
function atoiAt(s, i) {
  while (i < s.length && (s[i] === " " || s[i] === "	" || s[i] === "\n" || s[i] === "\r")) i++;
  let j = i;
  if (s[j] === "+" || s[j] === "-") j++;
  const start = j;
  while (j < s.length && s[j] >= "0" && s[j] <= "9") j++;
  if (j === start) return 0;
  const v = Number.parseInt(s.slice(i, j), 10);
  return Number.isNaN(v) ? 0 : v;
}
function txar(s, bias = 0) {
  const buf = new Array(501).fill(0);
  const len = s.length;
  let n = 0;
  for (let i = 0; i < len && n < SEQMAX; ) {
    const v = atoiAt(s, i);
    buf[n] = v + bias;
    const t = v + (v === 0 ? 1 : 0);
    i += Math.trunc(Math.log10(t * 100 + 1));
    n++;
  }
  return buf;
}
function arout(a, off = 0) {
  const g = (i) => a[i] ?? 0;
  if (g(0) === 0) return "0";
  const parts = [];
  for (let i = 0; g(i) !== 0; i++) parts.push(String(g(i) + off));
  return parts.join(",");
}
function seqLimit(n, _bias) {
  const a = new Array(501).fill(0);
  for (let i = 0; ; i++) {
    if (n < i) break;
    a[i] = i + 1;
  }
  return a;
}
function seqType0(s, bias) {
  const a = txar(s, bias);
  let n = 0;
  while ((a[n] ?? 0) !== 0) n++;
  if ((a[0] ?? 0) === 0) return "1";
  if ((a[n - 1] ?? 0) === 1) return "2";
  return "3";
}
function seqCompare(sa, sb, bias) {
  const a = new Array(502).fill(0);
  const p = txar(sa, bias);
  for (let i2 = 0; (p[i2] ?? 0) !== 0; i2++) a[i2] = p[i2];
  const q = txar(sb, bias);
  let i = 0;
  while (i < 502 && (a[i] ?? 0) === (q[i] ?? 0)) i++;
  if (i >= 502) return "1";
  return (a[i] ?? 0) < (q[i] ?? 0) ? "2" : "1";
}
var DecMode = {
  /** PPS2 / PPS3：a[x-1] -= 1 */
  DEC_MINUS1: 0,
  /** PPS4：向下扫到 a[c] <= a[p] */
  DEC_SCAN_LE: 1,
  /** weak / third：向下扫到 a[c] == a[p] */
  DEC_SCAN_EQ: 2,
  /** second / extremely weak：同上，且遇更小值直接跳到边界 */
  DEC_SCAN_EQ_SKIP: 3,
  /** PPS4 另一版本：条件同 DEC_SCAN_LE，但降级扫描向左一直到下标 0 */
  DEC_SCAN_LE_WIDE: 4
};
function ppsEx(a, n, x, decMode, liftMode) {
  const g = (i) => a[i] ?? 0;
  const v = g(x - 1);
  const p = v - 2;
  const L = x - 1 - p;
  for (let i = x - 2; i > p; i--) if (g(i) === g(p)) a[x - 1] = g(p);
  if (g(x - 1) !== g(p)) {
    if (decMode === DecMode.DEC_MINUS1) {
      a[x - 1] = g(x - 1) - 1;
    } else if (decMode === DecMode.DEC_SCAN_LE_WIDE) {
      let c = g(x - 1) - 3;
      for (; c >= 0; c--) {
        if (g(c) <= g(p)) {
          a[x - 1] = c + 2;
          break;
        }
      }
      if (c < 0) a[x - 1] = g(p);
    } else {
      for (let c = g(x - 1) - 3; g(p) - 1 <= c; c--) {
        const hit = decMode === DecMode.DEC_SCAN_LE ? g(c) <= g(p) : g(c) === g(p);
        if (hit) {
          a[x - 1] = c + 2;
          break;
        }
        if (decMode === DecMode.DEC_SCAN_EQ_SKIP && g(c) < g(p)) c = g(p) - 1;
        if (c === g(p) - 1) a[x - 1] = g(p);
      }
    }
  }
  for (let c = 0; c < n; c++) {
    for (let j = 0; j < L; j++) {
      const i = x - 1 + c * L + j;
      if ((i - p) % L === 0) {
        if (!liftMode) a[i + L] = g(i);
        else if (g(x - 1) === g(p)) a[i + L] = g(i);
        else a[i + L] = g(i) + L;
      } else if (v - 1 < g(i - L)) {
        a[i] = g(i - L) + L;
      } else {
        a[i] = g(i - L);
      }
    }
  }
  a[n * L + x - 1] = 0;
}

// src/core/notation.ts
var Notation = class {
  constructor() {
    /** 序列长度 / 矩阵行数 */
    this.x = 0;
    /** 矩阵列数 */
    this.y = 0;
    /** 展开步长（Y 系列、余数类） */
    this.l = 0;
    /** 父索引表（Y 系列） */
    this.pm = new Array(SEQMAX).fill(0);
  }
};
var SeqNotation = class extends Notation {
  constructor() {
    super(...arguments);
    /** 存储偏移：1 表示内部 +1 存储（把 0 让给结束哨兵），输出时再 -1 */
    this.bias = 0;
  }
  /** limit 的默认实现：1,2,...,n（带原程序的 off-by-one） */
  limitArr(n) {
    return seqLimit(n, this.bias);
  }
  parse(s) {
    return txar(s, this.bias);
  }
  out(a) {
    return arout(a, -this.bias);
  }
  fsLimit(a) {
    return this.out(this.limitArr(a));
  }
  typeOf(s) {
    return seqType0(s, this.bias);
  }
  pred(s) {
    const a = this.parse(s);
    let n = 1;
    while ((a[n] ?? 0) !== 0) n++;
    this.x = n;
    a[n - 1] = 0;
    return this.out(this.x === 1 ? new Array(SEQMAX).fill(0) : a);
  }
  fs(n, s) {
    const a = this.parse(s);
    let i = 1;
    while ((a[i] ?? 0) !== 0) i++;
    this.x = i;
    for (let k = 0; k < SEQMAX; k++) this.pm[k] = k;
    if (n === 0) a[this.x - 1] = 0;
    else this.ex(a, n);
    return this.out(a);
  }
  less(a, b) {
    return seqCompare(a, b, this.bias) === "2";
  }
};

// src/notations/pps4_v2.ts
var Pps4V2 = class extends SeqNotation {
  constructor() {
    super(...arguments);
    this.name = "Parented Predecessor Sequence 4 (v2)";
    this.bias = 1;
  }
  ex(a, n) {
    ppsEx(a, n, this.x, DecMode.DEC_SCAN_LE_WIDE, false);
  }
};
var pps4V2 = new Pps4V2();
var pps4_v2_default = pps4V2;
export {
  Pps4V2,
  pps4_v2_default as default,
  pps4V2
};

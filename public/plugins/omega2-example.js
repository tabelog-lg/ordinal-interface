/**
 * ONP2 记号插件示例 —— ω² 以下的序数（与内置记号 Omega2 (w^2) 等价）。
 *
 * 用法：在「选择序数记号」页点「添加序数记号位置」，选中本文件即可。
 *
 * 插件形态：一个**自包含的** ES module（不要 import 其它本地文件），
 * 默认导出实现 ONP2 五个方法的对象。方法必须是纯函数 —— 宿主会缓存结果。
 *
 * 内部表示：一对整数 (A, B) 表示 ω·A + B
 *   A = 0, B = 0   →  0
 *   A = 0, B > 0   →  有限数 B
 *   A > 0          →  ω·A + B
 *   A = -1         →  最大序数 Limit，也就是 ω²
 */

const LIMIT_A = -1;
const LONG_MAX = Number.MAX_SAFE_INTEGER;

const ord = (A, B) => ({ A, B });
const makeLimit = () => ord(LIMIT_A, 0);

function parse(s) {
  if (s == null) return ord(0, 0);
  s = String(s).trim();
  if (s === 'Limit') return makeLimit();

  if (s.startsWith('w')) {
    // "w" / "w+b" / "w*a" / "w*a+b"（另兼容 "w2"）
    let a = 1;
    let b = 0;
    const rest = s.substring(1);

    if (rest.startsWith('*')) {
      const tail = rest.substring(1);
      const plus = tail.indexOf('+');
      if (plus >= 0) {
        a = parseInt(tail.substring(0, plus), 10);
        b = parseInt(tail.substring(plus + 1), 10);
      } else {
        a = parseInt(tail, 10);
      }
    } else if (rest.startsWith('+')) {
      b = parseInt(rest.substring(1), 10);
    } else if (rest.length > 0) {
      const plus = rest.indexOf('+');
      if (plus >= 0) {
        a = parseInt(rest.substring(0, plus), 10);
        b = parseInt(rest.substring(plus + 1), 10);
      } else {
        a = parseInt(rest, 10);
      }
    }

    if (Number.isNaN(a)) a = 1;
    if (Number.isNaN(b)) b = 0;
    if (a <= 0) a = 1;
    return ord(a, b);
  }

  const n = Number(s);
  if (/^-?\d+$/.test(s) && Number.isSafeInteger(n)) return ord(0, n);
  return ord(0, 0);
}

function format(o) {
  if (o.A === LIMIT_A) return 'Limit';
  if (o.A === 0) return String(o.B);
  let s = 'w';
  if (o.A > 1) s += '*' + o.A;
  if (o.B > 0) s += '+' + o.B;
  return s;
}

function typeCode(o) {
  if (o.A === LIMIT_A) return '3';
  if (o.A === 0 && o.B === 0) return '1';
  if (o.B > 0) return '2';
  return '3';
}

function predecessor(o) {
  if (o.B > 0) return ord(o.A, o.B - 1);
  if (o.A > 0 && o.A !== LIMIT_A) return ord(o.A - 1, 0);
  return ord(0, 0);
}

function fsTerm(o, n) {
  if (n < 0) n = 0;
  if (o.A === LIMIT_A) return ord(n, 0); // ω² 的基本列：ω·n
  if (o.A > 0 && o.B === 0) return ord(o.A - 1, n); // ω·A 的基本列：ω·(A-1)+n
  return ord(0, 0); // 有限数没有基本列
}

function lessThan(x, y) {
  const xa = x.A === LIMIT_A ? LONG_MAX : x.A;
  const ya = y.A === LIMIT_A ? LONG_MAX : y.A;
  if (xa !== ya) return xa < ya;
  return x.B < y.B;
}

export default {
  name: 'Omega2 (w^2) - 示例文件版',
  description: 'ω² 以下的序数，ω·A+B 形式。最大序数 Limit = ω²',

  fsLimit(a) {
    return format(fsTerm(makeLimit(), a));
  },
  typeOf(a) {
    return typeCode(parse(a));
  },
  pred(a) {
    return format(predecessor(parse(a)));
  },
  fs(a, b) {
    return format(fsTerm(parse(b), a));
  },
  less(a, b) {
    return lessThan(parse(a), parse(b));
  },
};

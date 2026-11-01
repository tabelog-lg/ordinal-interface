/**
 * 性能基准（开发工具，不参与打包）。
 *
 * 目的：**先量再优化**。
 * 用法：esbuild 打包后 node 运行，输出各操作的耗时，改完代码再跑一次对比。
 */

import { omega2Notation } from '../src/engine/omega2';
import { omegaOmegaNotation as oo } from '../src/engine/omegaOmega';
import { EngineHost } from '../src/engine/host';
import { RulerEngine, type RulerPainter } from '../src/core/ruler';
import { TreeEngine } from '../src/core/tree';

const noop: RulerPainter = {
  clear: () => {},
  drawCenter: () => {},
  drawTick: () => {},
};

function time(label: string, fn: () => void): number {
  const t0 = process.hrtime.bigint();
  fn();
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  console.log(`  ${label.padEnd(52)} ${ms.toFixed(2).padStart(9)} ms`);
  return ms;
}

function section(s: string): void {
  console.log('\n── ' + s + ' ' + '─'.repeat(Math.max(0, 56 - s.length)));
}

const h1 = new EngineHost();
h1.load(omega2Notation);
const h2 = new EngineHost();
h2.load(oo);

// ════════════════════════════════════════════
section('1. 引擎查询（缓存命中 vs 首次）');

const warm = (h: EngineHost): void => {
  h.queryType('w');
  h.getFSTerm(3, 'w');
  h.isLessThan('w', 'w^2');
  h.validate('w*3+7');
};
warm(h1);
warm(h2);

time('Omega2  ×10000 次 queryType（缓存命中）', () => {
  for (let i = 0; i < 10000; i++) h1.queryType('w');
});
time('Omega2  ×10000 次 getFSTerm（缓存命中）', () => {
  for (let i = 0; i < 10000; i++) h1.getFSTerm(3, 'w');
});
time('Omega2  ×10000 次 isLessThan（缓存命中）', () => {
  for (let i = 0; i < 10000; i++) h1.isLessThan('w', 'w^2');
});

// ════════════════════════════════════════════
section('2. FirstExceeding —— 线性扫描（已知瓶颈）');

time('Omega2  firstExceeding("w*50","Limit") ×1000', () => {
  for (let i = 0; i < 1000; i++) h1.firstExceeding('w*50', 'Limit');
});
time('Omega2  firstExceeding("w*500","Limit") ×1000', () => {
  for (let i = 0; i < 1000; i++) h1.firstExceeding('w*500', 'Limit');
});
time('Omega2  firstExceeding("w*5000","Limit") ×1000', () => {
  for (let i = 0; i < 1000; i++) h1.firstExceeding('w*5000', 'Limit');
});
// 注意：ω^ω 的 Limit 基本列是 w^(n+1)，增长极快，从 Limit 往下找几步就到，
// 压不到线性扫描。要压到必须换「在 ω·k 这类慢速增长的基上找」。
time('ω^ω     firstExceeding("w*50","w^2") ×1000', () => {
  for (let i = 0; i < 1000; i++) h2.firstExceeding('w*50', 'w^2');
});
time('ω^ω     firstExceeding("w*500","w^2") ×1000', () => {
  for (let i = 0; i < 1000; i++) h2.firstExceeding('w*500', 'w^2');
});
time('ω^ω     firstExceeding("w*5000","w^2") ×1000', () => {
  for (let i = 0; i < 1000; i++) h2.firstExceeding('w*5000', 'w^2');
});

// 冷启动：每次换一个全新的引擎（缓存全空），测首次查询的真实代价
{
  const mkFresh = () => {
    const h = new EngineHost();
    h.load(omega2Notation);
    return h;
  };
  time('[冷] Omega2 firstExceeding("w*5000","Limit") ×200', () => {
    for (let i = 0; i < 200; i++) mkFresh().firstExceeding('w*5000', 'Limit');
  });
  const mkFresh2 = () => {
    const h = new EngineHost();
    h.load(oo);
    return h;
  };
  time('[冷] ω^ω    firstExceeding("w*5000","w^2") ×200', () => {
    for (let i = 0; i < 200; i++) mkFresh2().firstExceeding('w*5000', 'w^2');
  });
  time('[冷] ω^ω    validate("w^9*999+w^8*999") ×200', () => {
    for (let i = 0; i < 200; i++) mkFresh2().validate('w^9*999+w^8*999');
  });
}

// ════════════════════════════════════════════
section('3. ValidateExpression —— 逐位逼近 × 线性扫描');

time('Omega2  validate("w*3+7") ×1000', () => {
  for (let i = 0; i < 1000; i++) h1.validate('w*3+7');
});
time('Omega2  validate("w*300+7") ×200', () => {
  for (let i = 0; i < 200; i++) h1.validate('w*300+7');
});
time('ω^ω     validate("w^2*3+w*2+5") ×1000', () => {
  for (let i = 0; i < 1000; i++) h2.validate('w^2*3+w*2+5');
});
time('ω^ω     validate("w^2*300+w*2") ×200', () => {
  for (let i = 0; i < 200; i++) h2.validate('w^2*300+w*2');
});
time('ω^ω     validate("w^5*20+w^3*7+9") ×200', () => {
  for (let i = 0; i < 200; i++) h2.validate('w^5*20+w^3*7+9');
});
time('ω^ω     validate 非法串 "w^9*999+w^8*999" ×200', () => {
  for (let i = 0; i < 200; i++) h2.validate('w^9*999+w^8*999');
});

time('ω^ω     validate 同一非法串 ×2000（测缓存效果）', () => {
  for (let i = 0; i < 2000; i++) h2.validate('w^9*999+w^8*999');
});

// ════════════════════════════════════════════
section('4. 序数尺 —— 单次绘制 / 连续缩放');

const mk = (h: EngineHost): RulerEngine => {
  const r = new RulerEngine(h);
  r.height = 800;
  r.tickLength = 200;
  r.fontHeight = 32;
  r.textHalfHeight = 16;
  r.denseTickLimit = 65;
  r.init();
  return r;
};

const r1 = mk(h1);
time('Omega2  draw ×1000（稳态）', () => {
  for (let i = 0; i < 1000; i++) r1.draw(noop, false);
});
time('Omega2  wheel+draw ×300', () => {
  for (let i = 0; i < 300; i++) {
    r1.wheel(i % 2 === 0, 0);
    r1.draw(noop, false);
  }
});
time('Omega2  draw ×300（密集刻度开启）', () => {
  for (let i = 0; i < 300; i++) r1.draw(noop, true);
});

const r2 = mk(h2);
time('ω^ω     draw ×1000（稳态）', () => {
  for (let i = 0; i < 1000; i++) r2.draw(noop, false);
});
time('ω^ω     wheel+draw ×300', () => {
  for (let i = 0; i < 300; i++) {
    r2.wheel(i % 2 === 0, 0);
    r2.draw(noop, false);
  }
});

// ════════════════════════════════════════════
section('5. 展开树 —— 点击展开 / 绘制');

const t1 = new TreeEngine(h1);
t1.init();
time('Omega2  展开树连续展开 ×500', () => {
  for (let i = 0; i < 500; i++) {
    t1.init();
    t1.click(10, 43, true);
  }
});
let rows = 0;
{
  const t = new TreeEngine(h1);
  t.init();
  for (let i = 0; i < 200; i++) t.click(10, 43, false);
  for (const _ of t.visibleRows(800, 43)) rows++;
}
console.log(`  （连续点 200 次后的行数：${rows}）`);

const t2 = new TreeEngine(h2);
t2.init();
time('ω^ω     展开树连续展开 ×500', () => {
  for (let i = 0; i < 500; i++) {
    t2.init();
    t2.click(10, 43, true);
  }
});

// ════════════════════════════════════════════
section('6. 冷启动：选中记号时的初始化');

time('Omega2  ruler.init + tree.init ×200', () => {
  for (let i = 0; i < 200; i++) {
    const r = mk(h1);
    void r;
  }
});
time('ω^ω     ruler.init + tree.init ×200', () => {
  for (let i = 0; i < 200; i++) {
    const r = mk(h2);
    void r;
  }
});

console.log('\n完成。');

/**
 * 展开树视图（TabPage2）。
 *
 * 点击判定沿用原程序的做法：从 treeFirstVisible 起逐行累加行高，
 * 找到第一个「行顶 Y > 鼠标 Y」的行再回退一行 —— 网页版直接用 offsetY 取代了
 * 原程序手算的 captionOffset（那段是为了把屏幕坐标换算成客户区坐标）。
 *
 * ── 性能 ──────────────────────────────────────────────────────────
 *  · 重绘走 rAF 合并：滚轮连滚时一帧内只画一次，见 scheduleRedraw()；
 *  · `--row-h` 与字体家族只在构造时读一次。它们都是静态的，
 *    而 getComputedStyle 是强制同步布局（forced reflow），
 *    放在滚轮循环 / 每帧绘制路径上会是明显的浪费；
 *  · fillStyle 只在颜色真的变了才设，避免每行都触发一次状态切换。
 */

import type { TreeEngine } from '../core/tree';
import { engine } from '../engine/host';
import { settings, type AlignMode } from '../core/state';
import { CanvasSurface, WHEEL_STEP, normalizeWheel, $ } from './dom';

/** 对齐模式 → 用 levels 里的哪一项做缩进 */
const ALIGN_SLOT: Record<AlignMode, number | null> = {
  all: null, // 全部：不缩进
  fs: 1, // 基本序列
  continuous: 2, // 连续展开
  hypcos: 3, // Hyp Cos
};

export class TreeView {
  private surface: CanvasSurface;
  private accum = 0;
  private rafId = 0;

  /** 行高：与 CSS 的 --row-h 一致（原程序用 Panel1.Font.Height）。只在构造时读一次 */
  private readonly rowHeight: number;
  /** 字体家族同样只在构造时读一次 */
  private readonly fontFamily: string;

  constructor(
    private readonly tree: TreeEngine,
    canvas: HTMLCanvasElement,
  ) {
    this.rowHeight = readRowHeight();
    this.fontFamily = readFontFamily();
    this.surface = new CanvasSurface(canvas, () => this.scheduleRedraw());
    this.bindWheel(canvas);
    this.bindClick(canvas);
  }

  /** 把重绘合并到下一帧：滚轮连滚时一帧内触发多次也只画一次 */
  scheduleRedraw(): void {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.redraw();
    });
  }

  redraw(): void {
    this.surface.sync(); // 从隐藏页签切回来时尺寸会变
    const { ctx, width, height } = this.surface;
    ctx.fillStyle = settings.bgColor;
    ctx.fillRect(0, 0, width, height);

    const rowH = this.rowHeight;
    ctx.font = `${Math.round(rowH * 0.68)}px ${this.fontFamily}`;
    ctx.textBaseline = 'top';

    if (!engine.ready) {
      ctx.fillStyle = '#888';
      ctx.fillText('请先在「选择序数记号」里选中一个记号系统', 12, height / 2);
      return;
    }

    const slot = ALIGN_SLOT[settings.alignMode];
    const normal = settings.normalColor;
    const limit = settings.limitColor;
    let painted: string | null = null; // 上一个用过的颜色，避免重复设 fillStyle

    for (const { info, y } of this.tree.visibleRows(height, rowH)) {
      const color = info.isLimit ? limit : normal;
      if (color !== painted) {
        ctx.fillStyle = color;
        painted = color;
      }
      const indent = slot === null ? 0 : rowH * info.levels[slot];
      ctx.fillText(info.expression, indent + 6, y);
    }
  }

  private bindWheel(canvas: HTMLCanvasElement): void {
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        if (!engine.ready) return;

        this.accum += normalizeWheel(e);
        let steps = 0;
        while (Math.abs(this.accum) >= WHEEL_STEP && steps < 12) {
          const down = this.accum > 0; // 向下滚
          this.accum -= down ? WHEEL_STEP : -WHEEL_STEP;
          this.tree.wheel(down, this.rowHeight);
          steps++;
        }
        if (steps) this.scheduleRedraw();
      },
      { passive: false },
    );
  }

  private bindClick(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('click', (e) => {
      if (!engine.ready) return;
      const rect = canvas.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      if (this.tree.click(mouseY, this.rowHeight, settings.continuous)) this.scheduleRedraw();
    });
  }
}

/** 读 --row-h（CSS 变量）。取不到就退回 43px */
function readRowHeight(): number {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--row-h'));
  return Number.isFinite(v) && v > 0 ? v : 43;
}

function readFontFamily(): string {
  return getComputedStyle(document.body).fontFamily || 'sans-serif';
}

export function createTreeView(tree: TreeEngine): TreeView {
  return new TreeView(tree, $<HTMLCanvasElement>('tree-canvas'));
}

/**
 * 序数尺视图（TabPage3）。
 *
 * GDI+ → Canvas 2D 的两处注意：
 *  · 原程序用 FillRectangle(0, y, tickLength, 1) 画 1 像素刻度线。这里画 **1 个物理像素**
 *    （而不是 1 CSS 像素），因为原程序没有 DPI 缩放，在高分屏上画出来的就是 1 物理像素。
 *  · GDI 的 DrawString 用「文本块左上角」定位，canvas 的 fillText 用基线。
 *    序数尺用 textBaseline='middle' 对齐刻度中心（等价于原程序减掉 textHalfHeight）；
 *    展开树用 'top'（原程序没有减）。
 */

import type { RulerEngine, RulerPainter } from '../core/ruler';
import { engine } from '../engine/host';
import { settings } from '../core/state';
import { CanvasSurface, WHEEL_STEP, normalizeWheel, $ } from './dom';

export class RulerView {
  private surface: CanvasSurface;
  private accum = 0;

  constructor(
    private readonly ruler: RulerEngine,
    canvas: HTMLCanvasElement,
  ) {
    this.surface = new CanvasSurface(canvas, () => this.redraw());
    this.layout();
    this.bindWheel(canvas);
  }

  /** 对应原 RulerSizeChanged：尺寸变了就重算字体与刻度线长度 */
  private layout(): void {
    const h = this.surface.height;
    this.ruler.height = h;
    this.ruler.tickLength = Math.floor(h / 4);
    const fontSize = Math.max(9, h * 0.03);
    // GDI 的 Font.Height ≈ 字号 × 行距系数；雅黑约 1.35
    this.ruler.fontHeight = Math.round(fontSize * 1.35);
    this.ruler.textHalfHeight = Math.floor(this.ruler.fontHeight / 2);
    this.ruler.denseTickLimit = this.ruler.fontHeight * 2 + 1;
    this.fontSize = fontSize;
  }

  private fontSize = 16;

  redraw(): void {
    this.surface.sync(); // 从隐藏页签切回来时尺寸会变
    this.layout();
    const { ctx, width, height } = this.surface;
    const bg = settings.bgColor;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    if (!engine.ready) {
      ctx.fillStyle = '#888';
      ctx.font = `${Math.round(this.fontSize)}px ${getComputedStyle(document.body).fontFamily}`;
      ctx.textBaseline = 'middle';
      ctx.fillText('请先在「选择序数记号」里选中一个记号系统', 16, height / 2);
      return;
    }

    const painter = this.makePainter();
    this.ruler.draw(painter, settings.denseTicks);
  }

  private makePainter(): RulerPainter {
    const { ctx, dpr } = this.surface;
    const family = getComputedStyle(document.body).fontFamily;
    const tick = 1 / dpr; // 1 个物理像素
    const len = this.ruler.tickLength;

    const line = (y: number, isLimit: boolean) => {
      ctx.fillStyle = isLimit ? settings.limitColor : settings.normalColor;
      ctx.fillRect(0, Math.round(y * dpr) / dpr, len, tick);
    };
    const text = (y: number, expr: string, isLimit: boolean) => {
      ctx.fillStyle = isLimit ? settings.limitColor : settings.normalColor;
      ctx.font = `${this.fontSize}px ${family}`;
      ctx.textBaseline = 'middle';
      ctx.fillText(expr, len + 6, y);
    };

    return {
      clear: () => {
        ctx.fillStyle = settings.bgColor;
        ctx.fillRect(0, 0, this.surface.width, this.surface.height);
      },
      drawCenter: (y, expr, isLimit) => {
        line(y, isLimit);
        text(y, expr, isLimit);
      },
      drawTick: (y, expr, isLimit, showText) => {
        line(y, isLimit);
        if (showText && expr !== null) text(y, expr, isLimit);
      },
    };
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
          const zoomOut = this.accum > 0; // 向下滚 = 拉远
          this.accum -= zoomOut ? WHEEL_STEP : -WHEEL_STEP;
          const rect = canvas.getBoundingClientRect();
          const mouseY = e.clientY - rect.top;
          this.ruler.wheel(zoomOut, mouseY - this.surface.height / 2);
          steps++;
        }
        if (steps) this.redraw();
      },
      { passive: false },
    );
  }
}

/** 供 main.ts 在切换记号 / 改设置后调用 */
export function createRulerView(ruler: RulerEngine): RulerView {
  return new RulerView(ruler, $<HTMLCanvasElement>('ruler-canvas'));
}

/** 一些 DOM / canvas 小工具 */

export function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`找不到元素 #${id}`);
  return el as T;
}

let toastTimer: number | undefined;

export function toast(msg: string): void {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('show'), 3200);
}

/**
 * 一块按 devicePixelRatio 放大过的画布。
 *
 * 原程序开的是「主屏分辨率大小」的 Bitmap 再 1:1 显示，不做 DPI 缩放；
 * 网页版必须按 dpr 放大 backing store 再用 CSS 缩回去，否则高分屏上全是糊的。
 */
export class CanvasSurface {
  readonly ctx: CanvasRenderingContext2D;
  readonly dpr: number;
  /** CSS 像素宽高 */
  width = 1;
  height = 1;

  constructor(
    readonly canvas: HTMLCanvasElement,
    private readonly onResize: () => void,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('取不到 2D 绘图上下文');
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;

    this.sync();
    const ro = new ResizeObserver(() => {
      if (this.sync()) this.onResize();
    });
    ro.observe(canvas);
  }

  /** 返回尺寸是否真的变了 */
  sync(): boolean {
    const w = Math.max(1, this.canvas.clientWidth);
    const h = Math.max(1, this.canvas.clientHeight);
    const bw = Math.round(w * this.dpr);
    const bh = Math.round(h * this.dpr);
    const changed = w !== this.width || h !== this.height;
    this.width = w;
    this.height = h;
    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
    }
    // 之后所有绘图都用 CSS 像素坐标
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    return changed;
  }
}

/** 滚轮归一化：不同浏览器 / 设备的 deltaY 量级差异极大，统一折算成像素 */
export function normalizeWheel(e: WheelEvent): number {
  let d = e.deltaY;
  if (e.deltaMode === 1) d *= 16; // DOM_DELTA_LINE
  else if (e.deltaMode === 2) d *= 400; // DOM_DELTA_PAGE
  return d;
}

/** 一次「逻辑滚动」对应的像素量，约等于 WinForms 里滚一格（e.Delta = ±120） */
export const WHEEL_STEP = 100;

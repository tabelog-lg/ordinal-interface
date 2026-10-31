/**
 * 序数尺：一棵「可无限二分细分的树」+ 一条同层双向链表。
 *
 * 节点按需生成 —— 滚轮缩放到某一层，CreateChild / CreateSibling 才向引擎要下一批序数，
 * 所以理论上可以沿着 ω、ε₀、Γ₀ …… 一直放大下去，内存只随可见刻度增长。
 *
 * ── 与 VB 原版的差异（三处，都是有意的修复）────────────────────────
 *
 * ★ bug 2 修复：原程序 rootNode.Adjacent 只有 4 个槽位（0~3），而其它节点都是 6 个。
 *   滚轮拉远的某条分支会访问 rootNode.Adjacent(4) / (5)，VB 会抛 IndexOutOfRangeException；
 *   而两个边界节点（"0" 和 "Limit"）的 Adjacent 干脆是 Nothing，访问即 NullReference。
 *   这里统一成 6 槽，并让 CreateChild / CreateSibling 在"生不出来"时
 *   **返回 false 而不是崩溃**，调用方据此把视窗夹回边界。
 *   正常路径（upperNode 尚未到顶层）完全不受影响，行为与原程序一致。
 *
 * ★ 另外：原 CreateChild 不检查目标槽位是否已存在就直接覆盖，会切断同层链表。
 *   这里改成"已存在就直接返回"，正常调用点本来就先判空，所以不改变行为。
 *
 * ★ Nothing vs null：VB 里 `If x.Expression IsNot Nothing` 对空字符串 "" 也是 True。
 *   这里用 `expression: string | null`，null 表示 Nothing，"" 仍是合法的空串，
 *   判断一律写成 `!== null`，不能简写成 `if (expr)`。
 */

import { engine, type EngineHost } from '../engine/host';

/** 邻接下标 */
export const enum Adj {
  Lower = 0, // 下界节点
  Upper = 1, // 上界节点
  Down = 2, // 下子节点
  Up = 3, // 上子节点
  Prev = 4, // 同层的前一个（更小的一侧）
  Next = 5, // 同层的后一个（更大的一侧）
}

export interface RulerNode {
  /** 长度 6 的邻接数组，见 Adj */
  adj: (RulerNode | undefined)[];
  /** 该刻度对应的序数表达式；null 对应 VB 的 Nothing */
  expression: string | null;
  /** True 表示该节点位于其父节点的上侧 */
  isUpperSide: boolean;
  /** 该节点在其上界序数的基本列中的下标 */
  fsIndex: number;
  /** True 表示极限序数（用「极限序数颜色」绘制） */
  isLimit: boolean;
  /** 边界节点（"0" / "Limit"）：没有父节点，也没有同层邻居 */
  isBoundary?: boolean;
}

/** 绘制回调，由视图层实现；状态机只负责"什么时候画哪个节点" */
export interface RulerPainter {
  clear(): void;
  /** 正中间那条刻度 —— 画的是「视窗下界节点的上界」 */
  drawCenter(y: number, expr: string, isLimit: boolean): void;
  drawTick(y: number, expr: string | null, isLimit: boolean, showText: boolean): void;
}

const emptyAdj = (): (RulerNode | undefined)[] => [
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
];

function makeNode(init: Partial<RulerNode> = {}): RulerNode {
  return {
    adj: emptyAdj(),
    expression: null,
    isUpperSide: false,
    fsIndex: 0,
    isLimit: false,
    ...init,
  };
}

export class RulerEngine {
  /** 引擎宿主可注入（默认用全局单例），便于单独测试 */
  constructor(private readonly host: EngineHost = engine) {}

  rootNode!: RulerNode;
  lowerNode!: RulerNode;
  upperNode!: RulerNode;

  /** 视窗中心（沿整条尺子 0~1） */
  viewCenter = 0.5;
  /** 视窗跨度；越小越放大，0.5 = 全景 */
  viewSpan = 0.5;

  /** 画布高度（CSS 像素），由视图层在 resize 时写入 */
  height = 1;
  /** 刻度线长度 */
  tickLength = 0;
  /** 尺子文字的行高 */
  fontHeight = 1;
  /** 文字半高，用于垂直居中 */
  textHalfHeight = 0;
  /** 低于这个间距就不再细分（除非勾了「序数尺密集刻度」） */
  denseTickLimit = 0;

  private tickGap = 0;
  private rulerCenterY = 0;

  /** 选中一个记号系统后重建整棵尺子树 */
  init(): void {
    this.rootNode = makeNode();
    this.lowerNode = makeNode();
    this.upperNode = makeNode();

    // 根节点夹在常数节点 "0" 与 "Limit" 之间
    const zero = makeNode({ expression: '0', isBoundary: true });
    const limit = makeNode({ expression: 'Limit', isBoundary: true });

    this.rootNode.adj = [zero, limit, this.lowerNode, this.upperNode, undefined, undefined];

    const fe = this.host.firstExceeding(zero.expression!, limit.expression!);
    this.rootNode.expression = fe.expr;
    this.rootNode.fsIndex = fe.index;

    this.lowerNode.adj = [zero, this.rootNode, undefined, undefined, undefined, this.upperNode];
    if (this.host.queryType(this.rootNode.expression) === '3') {
      this.rootNode.isLimit = true;
      const fe2 = this.host.firstExceeding(zero.expression!, this.rootNode.expression);
      this.lowerNode.expression = fe2.expr;
      this.lowerNode.fsIndex = fe2.index;
    } else {
      this.lowerNode.expression = null;
      this.rootNode.isLimit = false;
    }
    this.lowerNode.isUpperSide = false;
    if (this.lowerNode.expression !== null) {
      this.lowerNode.isLimit = this.host.queryType(this.lowerNode.expression) === '3';
    }

    this.upperNode.adj = [this.rootNode, limit, undefined, undefined, this.lowerNode, undefined];
    this.upperNode.fsIndex = this.rootNode.fsIndex + 1;
    this.upperNode.expression = this.host.getFSTerm(this.upperNode.fsIndex, limit.expression!);
    this.upperNode.isUpperSide = true;
    if (this.upperNode.expression !== null) {
      this.upperNode.isLimit = this.host.queryType(this.upperNode.expression) === '3';
    }

    this.viewCenter = 0.5;
    this.viewSpan = 0.5;
  }

  // ————————————————————————————————————————————
  //  按需生成节点
  // ————————————————————————————————————————————

  /**
   * 生成一个子节点（原 Sub3）。upward=true 生成上子节点(3)，false 生成下子节点(2)。
   * 生成后立刻把它接进同层的双向链表。返回是否真的新建了节点。
   */
  private createChild(node: RulerNode, upward: boolean): boolean {
    if (upward) {
      if (node.adj[Adj.Up]) return false; // 已存在就不再覆盖（见文件头说明）
      const parentUpper = node.adj[Adj.Upper];
      if (!parentUpper) return false;

      const child = makeNode({
        adj: [node, parentUpper, undefined, undefined, undefined, undefined],
        isUpperSide: true,
      });
      node.adj[Adj.Up] = child;

      if (node.expression !== null) {
        // 上子节点 = 上界序数基本列的下一项
        child.fsIndex = node.fsIndex + 1;
        child.expression = this.host.getFSTerm(child.fsIndex, parentUpper.expression!);
        child.isLimit = this.host.queryType(child.expression) === '3';
      }

      const down = node.adj[Adj.Down];
      if (down) {
        child.adj[Adj.Prev] = down;
        down.adj[Adj.Next] = child;
      }
      const next = node.adj[Adj.Next];
      if (next && next.adj[Adj.Down]) {
        child.adj[Adj.Next] = next.adj[Adj.Down];
        next.adj[Adj.Down]!.adj[Adj.Prev] = child;
      }
    } else {
      if (node.adj[Adj.Down]) return false;
      const parentLower = node.adj[Adj.Lower];
      if (!parentLower) return false;

      const child = makeNode({
        adj: [parentLower, node, undefined, undefined, undefined, undefined],
      });
      node.adj[Adj.Down] = child;

      const prev = node.adj[Adj.Prev];
      if (prev && prev.adj[Adj.Up]) {
        child.adj[Adj.Prev] = prev.adj[Adj.Up];
        prev.adj[Adj.Up]!.adj[Adj.Next] = child;
      }
      const up = node.adj[Adj.Up];
      if (up) {
        child.adj[Adj.Next] = up;
        up.adj[Adj.Prev] = child;
      }

      if (node.expression !== null && node.isLimit) {
        // 下子节点 = 本节点基本列中第一个大于下界的项
        const fe = this.host.firstExceeding(parentLower.expression!, node.expression);
        child.expression = fe.expr;
        child.fsIndex = fe.index;
        child.isLimit = this.host.queryType(child.expression) === '3';
      }
    }
    return true;
  }

  /**
   * 生成一个同层邻居（原 Sub4）。forward=true 生成后一个(5)，false 生成前一个(4)。
   * 做法是先走到相邻节点，再让它生成一个子节点 —— 那个子节点就是本节点要的邻居。
   *
   * 返回 false 表示"到边界了，生不出来"（原程序在这里会抛异常）。
   */
  private createSibling(node: RulerNode, forward: boolean): boolean {
    if (forward) {
      if (node.isUpperSide) {
        const parent = node.adj[Adj.Lower];
        if (!parent || parent.isBoundary) return false;
        if (!parent.adj[Adj.Next]) this.createSibling(parent, false);
        const target = parent.adj[Adj.Next];
        if (!target) return false;
        return this.createChild(target, false);
      } else {
        const upper = node.adj[Adj.Upper];
        if (!upper || upper.isBoundary) return false;
        return this.createChild(upper, true);
      }
    } else {
      if (node.isUpperSide) {
        const parent = node.adj[Adj.Lower];
        if (!parent || parent.isBoundary) return false;
        return this.createChild(parent, false);
      } else {
        const upper = node.adj[Adj.Upper];
        if (!upper || upper.isBoundary) return false;
        if (!upper.adj[Adj.Prev]) this.createSibling(upper, false);
        const target = upper.adj[Adj.Prev];
        if (!target) return false;
        return this.createChild(target, true);
      }
    }
  }

  /** 确保 node 的子节点存在并返回它；生不出来返回 undefined */
  private ensureChild(node: RulerNode, upward: boolean): RulerNode | undefined {
    const slot = upward ? Adj.Up : Adj.Down;
    if (!node.adj[slot]) this.createChild(node, upward);
    return node.adj[slot];
  }

  /** 确保 node 的第 slot 个同层邻居存在 */
  private ensureSibling(node: RulerNode, forward: boolean): boolean {
    const slot = forward ? Adj.Next : Adj.Prev;
    if (node.adj[slot]) return true;
    this.createSibling(node, forward);
    return node.adj[slot] !== undefined;
  }

  // ————————————————————————————————————————————
  //  滚轮缩放
  // ————————————————————————————————————————————

  /**
   * @param zoomOut true = 拉远（向下滚），false = 拉近（向上滚）
   * @param mouseOffset 鼠标相对画布中心的像素偏移（向下为正）
   */
  wheel(zoomOut: boolean, mouseOffset: number): void {
    const H = this.height;

    if (zoomOut) {
      // —— 拉远
      this.viewSpan = this.viewSpan / 0.9;
      this.viewCenter += (this.viewSpan * mouseOffset) / H * 0.2;

      if (this.upperNode === this.rootNode.adj[Adj.Up]) {
        // 还在最顶层，不允许再拉远
        if (this.viewSpan > 0.5) this.viewSpan = 0.5;
      } else if (this.viewSpan > 0.25) {
        // 换用更粗的一层刻度
        this.viewSpan *= 0.5;
        if (this.lowerNode.isUpperSide) {
          this.viewCenter = (this.viewCenter + 0.5) * 0.5;
          this.lowerNode = this.lowerNode.adj[Adj.Lower]!;
          this.upperNode = this.upperNode.adj[Adj.Upper]!;
        } else if (this.lowerNode.adj[Adj.Upper]?.isUpperSide) {
          this.viewCenter = (this.viewCenter + 1) * 0.5;
          this.upperNode = this.lowerNode.adj[Adj.Upper];
          this.ensureSibling(this.upperNode, false);
          if (this.upperNode.adj[Adj.Prev]) this.lowerNode = this.upperNode.adj[Adj.Prev];
        } else {
          this.viewCenter *= 0.5;
          this.lowerNode = this.lowerNode.adj[Adj.Upper]!;
          this.ensureSibling(this.lowerNode, true);
          if (this.lowerNode.adj[Adj.Next]) this.upperNode = this.lowerNode.adj[Adj.Next];
        }
      }
    } else {
      // —— 拉近
      this.viewCenter -= (this.viewSpan * mouseOffset) / H * 0.2;
      this.viewSpan *= 0.9;
      if (this.viewSpan < 0.125) {
        // 换用更细的一层刻度
        this.viewSpan *= 2;
        this.viewCenter = this.viewCenter * 2 - 0.5;

        // ★ 网页版新增的健壮性改进：原程序无条件地把 lowerNode / upperNode 移到
        //   子节点上。但 CreateChild 生成的子节点可能是"空节点"（Expression = null）——
        //   例如 ω 与 ω+1 之间根本不存在序数，于是 ω+1 的下子节点为空。
        //   原程序会移过去，导致整屏刻度突然消失。这里改成：新节点为空就停在原地。
        const up = this.ensureChild(this.lowerNode, true);
        if (up && up.expression !== null) this.lowerNode = up;
        const down = this.ensureChild(this.upperNode, false);
        if (down && down.expression !== null) this.upperNode = down;
      }
    }

    // —— 把视窗夹回 [0,1]：越界就把整个视窗挪一格
    if (this.viewCenter < this.viewSpan) {
      if (this.lowerNode.adj[Adj.Lower] === this.rootNode.adj[Adj.Lower]) {
        this.viewCenter = this.viewSpan;
      } else {
        const newUpper = this.lowerNode;
        this.ensureSibling(this.lowerNode, false);
        const prev = this.lowerNode.adj[Adj.Prev];
        // ★ 同上：邻居是空节点就夹紧，不要移过去
        if (prev && prev.expression !== null) {
          this.upperNode = newUpper;
          this.lowerNode = prev;
          this.viewCenter += 0.5;
        } else {
          this.viewCenter = this.viewSpan; // ★ 到边界了，夹紧而不是崩溃
        }
      }
    } else if (this.viewCenter + this.viewSpan > 1) {
      if (this.upperNode.adj[Adj.Upper] === this.rootNode.adj[Adj.Upper]) {
        this.viewCenter = 1 - this.viewSpan;
      } else {
        const newLower = this.upperNode;
        this.ensureSibling(this.upperNode, true);
        const next = this.upperNode.adj[Adj.Next];
        // ★ 同上
        if (next && next.expression !== null) {
          this.lowerNode = newLower;
          this.upperNode = next;
          this.viewCenter -= 0.5;
        } else {
          this.viewCenter = 1 - this.viewSpan; // ★ 同上
        }
      }
    }
  }

  // ————————————————————————————————————————————
  //  绘制
  // ————————————————————————————————————————————

  /** 绘制序数尺（原 Sub1） */
  draw(painter: RulerPainter, denseTicks: boolean): void {
    painter.clear();

    const H = this.height;
    this.tickGap = Math.round(H / this.viewSpan / 4);
    this.rulerCenterY = Math.round(H * (1 + (this.viewCenter - 0.5) / this.viewSpan) * 0.5);

    // 正中间画的是「视窗下界节点的上界」
    const center = this.lowerNode.adj[Adj.Upper];
    if (center && center.expression !== null) {
      painter.drawCenter(this.rulerCenterY, center.expression, center.isLimit);
    }

    // 下半屏：从中心往下递归细分
    if (this.lowerNode.expression !== null) {
      const g = this.tickGap;
      this.drawTicks(
        this.lowerNode,
        this.rulerCenterY,
        this.rulerCenterY + idiv(g, 2),
        this.rulerCenterY + g,
        idiv(g, 2),
        painter,
        denseTicks,
      );
    }
    // 上半屏：从中心往上递归细分
    if (this.upperNode.expression !== null) {
      const g = this.tickGap;
      this.drawTicks(
        this.upperNode,
        this.rulerCenterY - g,
        this.rulerCenterY - idiv(g, 2),
        this.rulerCenterY,
        idiv(g, 2),
        painter,
        denseTicks,
      );
    }
  }

  /** 递归绘制一段刻度（原 Sub2） */
  private drawTicks(
    node: RulerNode,
    topY: number,
    nodeY: number,
    bottomY: number,
    halfGap: number,
    painter: RulerPainter,
    denseTicks: boolean,
  ): void {
    const H = this.height;

    if (nodeY > 0 && nodeY < H) {
      painter.drawTick(nodeY, node.expression, node.isLimit, halfGap > this.fontHeight);
    }

    // 太密了就不再往下细分，除非勾选了「序数尺密集刻度」
    if (halfGap <= this.denseTickLimit && (halfGap <= 0 || !denseTicks)) return;

    if (nodeY < H && bottomY > 0) {
      if (!node.adj[Adj.Down]) this.createChild(node, false);
      const down = node.adj[Adj.Down];
      if (down && down.expression !== null) {
        const hg = idiv(bottomY - nodeY, 2);
        this.drawTicks(down, nodeY, nodeY + hg, bottomY, hg, painter, denseTicks);
      }
    }

    if (topY < H && nodeY > 0) {
      if (!node.adj[Adj.Up]) this.createChild(node, true);
      const up = node.adj[Adj.Up];
      if (up) {
        const hg = idiv(nodeY - topY, 2);
        this.drawTicks(up, topY, nodeY - hg, nodeY, hg, painter, denseTicks);
      }
    }
  }
}

/** VB 的整数除法 `\`：先取整再向零截断 */
function idiv(a: number, b: number): number {
  return Math.trunc(a / b);
}

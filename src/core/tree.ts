/**
 * 展开树：基本列的逐层展开。
 *
 * 一条双向链表，初始只有 Limit 和 0 两行。点击某个极限序数行，
 * 就在它和下一行之间插入「首超项」；勾选「展开树连续展开」则一路展开到底。
 * 每行带 4 个整数用于缩进，设置页的四种对齐模式决定用哪一个。
 *
 * ★ bug 1 修复：Levels(0) 的语义是「已展开到第几项」，-1 表示尚未展开。
 *   原程序在首次展开后写入的是 **像素坐标 targetY**，于是同一行第二次点击时
 *   会走"再次展开"分支，把这个像素值当成基本列下标继续 +1，得到离谱的结果。
 *   这里写入的是 FirstExceeding 真正用到的基本列下标 fe.index ——
 *   于是第二次点击 +1 后正好是基本列的下一项，语义自洽。
 */

import { engine, type EngineHost } from '../engine/host';
import { DList, type DNode } from './dlist';

/**
 * 「连续展开」单次点击最多插入的节点数。
 *
 * 原程序（以及本项目初版）这里的 for(;;) 只以「下一行不是极限序数」为终止条件。
 * 四个 PPS4 弱化变体（pps4_weak / pps4_second / pps4_third /
 * pps4_extremely_weak）连续展开出的新节点始终被判为极限，链表会无限增长：
 * 实测 15 秒吃满 1 GB 堆后 V8 直接 FATAL ERROR，页面进程被杀。
 *
 * 这是**只加护栏、不改任何展开规则**：正常记号在到达上限前早就收敛
 * （对照组 pps4 连续点 8 次也只到 130 行），单击模式与序数尺完全不受影响。
 */
const CONTINUOUS_EXPAND_GUARD = 10_000;

export interface TreeNodeInfo {
  /** 序数表达式 */
  expression: string;
  /**
   * 层级 / 缩进信息：
   *   0 = 已展开到第几项（-1 表示尚未展开）
   *   1 = 展开深度，每次展开 +1
   *   2 = 基本序列序号
   *   3 = 连续展开深度
   */
  levels: [number, number, number, number];
  /** True 表示极限序数 */
  isLimit: boolean;
}

export interface VisibleRow {
  info: TreeNodeInfo;
  /** 该行在画布上的 Y 坐标 */
  y: number;
}

export class TreeEngine {
  /** 引擎宿主可注入（默认用全局单例），便于单独测试 */
  constructor(private readonly host: EngineHost = engine) {}

  readonly tree = new DList<TreeNodeInfo>();
  firstVisible: DNode<TreeNodeInfo> | null = null;
  /** 垂直滚动偏移（像素） */
  scrollOffset = 0;

  init(): void {
    this.tree.clear();
    this.tree.addLast({ expression: 'Limit', levels: [-1, 0, 0, 0], isLimit: true });
    this.tree.addLast({ expression: '0', levels: [-1, 0, 0, 0], isLimit: false });
    this.scrollOffset = 0;
    this.firstVisible = this.tree.first;
  }

  /** 滚轮滚动 */
  wheel(down: boolean, rowHeight: number): void {
    if (down) {
      if (this.firstVisible?.next) {
        this.scrollOffset -= rowHeight * 3;
        while (this.scrollOffset < -rowHeight) {
          if (!this.firstVisible?.next) {
            this.scrollOffset = 0;
            break;
          }
          this.firstVisible = this.firstVisible.next;
          if (!this.firstVisible.next) this.scrollOffset = 0;
          else this.scrollOffset += rowHeight;
        }
      }
    } else {
      this.scrollOffset += rowHeight * 3;
      while (this.scrollOffset > 0) {
        if (!this.firstVisible?.prev) {
          this.scrollOffset = 0;
          continue; // 回到循环头，条件已为 false，随即退出
        }
        this.scrollOffset -= rowHeight;
        this.firstVisible = this.firstVisible.prev;
      }
    }
  }

  /** 点击某一行：若是极限序数就在它下面插入一项。返回是否发生了插入。 */
  click(mouseY: number, rowHeight: number, continuous: boolean): boolean {
    let targetY = this.scrollOffset;
    let cursor = this.firstVisible;

    while (cursor) {
      if (targetY > mouseY) {
        // 命中：游标回退一行，就是被点中的那一行
        cursor = cursor.prev;
        if (!cursor) return false;
        if (!cursor.value.isLimit) return false;

        // 对象是引用类型，通过它修改 levels 等价于修改链表里那个节点
        const current = cursor.value;

        if (current.levels[0] < 0) {
          // 首次展开：在被点节点与它的下一行之间插入「首超项」
          const nextLine = cursor.next;
          if (!nextLine) return false;

          const fe = this.host.firstExceeding(nextLine.value.expression, current.expression);
          const newNode: TreeNodeInfo = {
            expression: fe.expr,
            levels: [-1, current.levels[1] + 1, current.levels[2], 0],
            isLimit: this.host.queryType(fe.expr) === '3',
          };
          this.tree.addAfter(cursor, newNode);

          // ★ 原程序写的是像素坐标 targetY；这里写基本列下标
          current.levels[0] = fe.index;

          // 新插入那一行的「连续展开深度」
          const nextRow = cursor.next!.value;
          const afterNext = cursor.next!.next?.value;
          const afterDepth = afterNext ? afterNext.levels[3] : 0;
          nextRow.levels[3] =
            current.levels[3] > afterDepth ? current.levels[3] : current.levels[3] + 1;
        } else {
          // 再次展开：取基本列的下一项
          current.levels[0] += 1;
          const expr = this.host.getFSTerm(current.levels[0], current.expression);
          const nextLine = cursor.next;
          if (!nextLine) return false;
          const newNode: TreeNodeInfo = {
            expression: expr,
            levels: [
              -1,
              current.levels[1] + 1,
              nextLine.value.levels[2] + 1,
              current.levels[3] + 1,
            ],
            isLimit: this.host.queryType(expr) === '3',
          };
          this.tree.addAfter(cursor, newNode);
        }

        if (continuous) {
          // 连续展开：一路往下插，直到遇到非极限序数。
          // ★ 节点数护栏：某些记号的展开链不会自然收敛（见文件头注释），
          //   没有上限会把整个页面进程拖进 OOM。
          let inserted = 0;
          for (;;) {
            if (++inserted > CONTINUOUS_EXPAND_GUARD) break;
            cursor = cursor.next;
            if (!cursor) break;
            if (!cursor.value.isLimit) break;
            const next = cursor.next;
            if (!next) break;

            const current2 = cursor.value;
            const fe = this.host.firstExceeding(next.value.expression, current2.expression);
            const newNode: TreeNodeInfo = {
              expression: fe.expr,
              levels: [-1, current2.levels[1] + 1, current2.levels[2], 0],
              isLimit: this.host.queryType(fe.expr) === '3',
            };
            this.tree.addAfter(cursor, newNode);

            current2.levels[0] = fe.index; // ★ 同上

            const nextRow = cursor.next!.value;
            const afterNext = cursor.next!.next?.value;
            const afterDepth = afterNext ? afterNext.levels[3] : 0;
            nextRow.levels[3] =
              current2.levels[3] > afterDepth ? current2.levels[3] : current2.levels[3] + 1;
          }
        }

        return true;
      }

      cursor = cursor.next;
      targetY += rowHeight;
    }
    return false;
  }

  /** 从上到下遍历可见行 */
  *visibleRows(height: number, rowHeight: number): Generator<VisibleRow> {
    let drawY = this.scrollOffset;
    let cursor = this.firstVisible;
    while (drawY < height && cursor) {
      yield { info: cursor.value, y: drawY };
      drawY += rowHeight;
      cursor = cursor.next;
    }
  }
}

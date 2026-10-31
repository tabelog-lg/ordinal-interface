/**
 * 最小双向链表（对应原程序的 LinkedList(Of TreeNodeInfo)）。
 *
 * JS 没有内置双向链表。展开树必须用它：树视图持有 `treeFirstVisible`
 * 这个**节点引用**并在插入行后继续使用它 —— 用数组 + splice 会让引用失效。
 */

export class DNode<T> {
  value: T;
  prev: DNode<T> | null = null;
  next: DNode<T> | null = null;
  constructor(value: T) {
    this.value = value;
  }
}

export class DList<T> {
  head: DNode<T> | null = null;
  tail: DNode<T> | null = null;

  get first(): DNode<T> | null {
    return this.head;
  }

  get last(): DNode<T> | null {
    return this.tail;
  }

  addLast(value: T): DNode<T> {
    const node = new DNode(value);
    if (this.tail) {
      node.prev = this.tail;
      this.tail.next = node;
      this.tail = node;
    } else {
      this.head = this.tail = node;
    }
    return node;
  }

  addAfter(node: DNode<T>, value: T): DNode<T> {
    const fresh = new DNode(value);
    fresh.prev = node;
    fresh.next = node.next;
    if (node.next) node.next.prev = fresh;
    else this.tail = fresh;
    node.next = fresh;
    return fresh;
  }

  clear(): void {
    this.head = this.tail = null;
  }
}

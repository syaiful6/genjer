export type Item = {
  id: number;
  sortIndex: number;
}

export type Heap<I> = I[];

export function push<H extends Heap<I>, I extends Item>(heap: H, node: I): void {
  const index = heap.length;
  heap.push(node);
  siftUp(heap, node, index);
}

export function peek<H extends Heap<I>, I extends Item>(heap: H): I | null {
  const first = heap[0];
  return first === undefined ? null : first;
}

export function pop<H extends Heap<I>, I extends Item>(heap: H): I | null {
  const first = heap[0];
  if (first !== undefined) {
    const last = heap.pop();
    if (last !== first && last) {
      heap[0] = last;
      siftDown(heap, last, 0);
    }
    return first;
  } else {
    return null;
  }
}

function siftUp(heap: Heap<any>, node: Item, i: number) {
  let index = i;
  while (true) {
    const parentIndex = Math.floor((index - 1) / 2);
    const parent = heap[parentIndex];
    if (parent !== undefined && compare(parent, node) > 0) {
      // The parent is larger. Swap positions.
      heap[parentIndex] = node;
      heap[index] = parent;
      index = parentIndex;
    } else {
      // The parent is smaller. Exit.
      return;
    }
  }
}

function siftDown(heap: Heap<any>, node: Item, i: number) {
  let index = i;
  const length = heap.length;
  while (index < length) {
    const leftIndex = (index + 1) * 2 - 1;
    const left = heap[leftIndex];
    const rightIndex = leftIndex + 1;
    const right = heap[rightIndex];

    // If the left or right node is smaller, swap with the smaller of those.
    if (left !== undefined && compare(left, node) < 0) {
      if (right !== undefined && compare(right, left) < 0) {
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex;
      } else {
        heap[index] = left;
        heap[leftIndex] = node;
        index = leftIndex;
      }
    } else if (right !== undefined && compare(right, node) < 0) {
      heap[index] = right;
      heap[rightIndex] = node;
      index = rightIndex;
    } else {
      // Neither child is smaller. Exit.
      return;
    }
  }
}

function compare(a: Item, b: Item) {
  // Compare sort index first, then task id.
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}

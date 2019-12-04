import {VNode, VNodeData, vnode, Key} from 'snabbdom/vnode';

export interface ThunkData extends VNodeData {
  fn: () => VNode;
  args: any[];
  emit: (_: any) => void;
}

export interface Thunk extends VNode {
  data: ThunkData;
}

function copyToThunk(vnode: VNode, thunk: VNode): void {
  thunk.elm = vnode.elm;
  (vnode.data as VNodeData).fn = (thunk.data as VNodeData).fn;
  (vnode.data as VNodeData).args = (thunk.data as VNodeData).args;
  (vnode.data as VNodeData).emit = (thunk.data as VNodeData).emit;
  thunk.data = vnode.data;
  thunk.children = vnode.children;
  thunk.text = vnode.text;
  thunk.elm = vnode.elm;
}

function init(thunk: VNode): void {
  const cur = thunk.data as VNodeData;
  const vnode = (cur.fn as any)(cur.emit, ...cur.args as any[]);
  copyToThunk(vnode, thunk);
}

function prepatch(oldVnode: VNode, thunk: VNode): void {
  let i: number, old = oldVnode.data as VNodeData, cur = thunk.data as VNodeData;
  const oldArgs = old.args, args = cur.args;
  if (old.fn !== cur.fn || (oldArgs as any).length !== (args as any).length) {
    copyToThunk((cur.fn as any)(cur.emit, ...args as any[]), thunk);
    return;
  }
  for (i = 0; i < (args as any).length; ++i) {
    if ((oldArgs as any)[i] !== (args as any)[i]) {
      copyToThunk((cur.fn as any)(cur.emit, ...args as any[]), thunk);
      return;
    }
  }
  copyToThunk(oldVnode, thunk);
}

export function thunk(sel: string, fn: Function, emit: Function, args: any[], key?: Key): VNode {
  return vnode(sel, {
    key: key,
    hook: {init, prepatch},
    fn: fn,
    emit: emit,
    args: args
  }, undefined, undefined, undefined);
};

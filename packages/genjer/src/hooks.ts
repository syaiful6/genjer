import {VNode, VNodeData, vnode as CreateVNode, Key} from 'snabbdom/vnode';
import {currentSignal} from './signal';
import {id} from './utils';
import {scheduleCallback, PriorityLevel} from './scheduler';

type Effect = () => void;

type EffectFn = () => Effect | void;

type HookedState = {
  setup: boolean;
  states: any[];
  statesIndex: number,
  depsStates: any[],
  depsIndex: number,
  updates: Effect[],
  cleanups: Map<'_' | number, () => void>
}

let currentState: HookedState;

const call = Function.prototype.call.bind(
  Function.prototype.call
);

function updateDeps(deps: null | any[]): boolean {
  const state = currentState;
  const depsIndex = state.depsIndex++;
  const prevDeps = state.depsStates[depsIndex] || [];
  const shouldRecompute = deps === undefined
    ? true // Always compute
    : Array.isArray(deps)
      ? deps.length > 0
        ? !deps.every((x,i) => x === prevDeps[i]) // Only compute when one of the deps has changed
        : !state.setup // Empty array: only compute at mount
      : false; // Invalid value, do nothing
  state.depsStates[depsIndex] = deps;
  return shouldRecompute;
}

function resolveCurrentSignal() {
  let sign = currentSignal.current;
  if (sign === null) {
    throw new Error('useXXX hook can only called in render function');
  }
  return sign;
}

type UpdateFn<S = any> = (s: S | ((_: S) => S), ix: number) => S;
export interface SetStateFn<S> {
  (_: S): void;
  (_: (_: S) => S): void;
}

function updateState<S = any>(initialValue: S, newValueFn: UpdateFn = id): [S, SetStateFn<S>, number]  {
  const state = currentState;
  const index = state.statesIndex++;
  if (!state.setup) {
    state.states[index] = initialValue;
  }
  const signal = resolveCurrentSignal();
  return [
    state.states[index],
    (value: any) => {
      const previousValue = state.states[index];
      const newValue = newValueFn(value, index);
      state.states[index] = newValue;
      if (newValue !== previousValue) {
        signal.push({}); // rerender
      }
    },
    index
  ];
}

export function useState<S>(initialValue: S): [S, SetStateFn<S>, number] {
  const state = currentState;
  const newValueFn: UpdateFn = (value: any, index: number) =>
    typeof value === "function"
      ? value(state.states[index])
      : value;
  return updateState(initialValue, newValueFn);
}

export function useReducer<S, A>(reducer: (s: S, a: A) => S, init: S): [S, (a: A) => void] {
  const state = currentState;
  const [value, setValue, index] = updateState(init);
  const dispatch = (action: A) => {
    const previousValue = state.states[index];
    setValue(reducer(previousValue, action))
  };

  return [value, dispatch];
}

export function useEffect(fn: EffectFn, deps: any[]) {
  const state = currentState;
  const shouldRecompute = updateDeps(deps);
  if (shouldRecompute) {
    const depsIndex = state.depsIndex;
    const signal = resolveCurrentSignal();
    const runCallbackFn = () => {
      const teardown = fn();
      // A callback may return a function. If any, add it to the cleanups:
      if (typeof teardown === "function") {
        // Store this this function to be called at cleanup and unmount
        state.cleanups.set(depsIndex, teardown);
        // At unmount, call re-render at least once
        state.cleanups.set("_", () => signal.push({}));
      }
    };

    // First clean up any previous cleanup function
    const teardown = state.cleanups.get(depsIndex);
    try {
      if (typeof teardown === "function") {
        teardown();
      }
    }
    finally {
      state.cleanups.delete(depsIndex);
    }

    state.updates.push(() => scheduleCallback(PriorityLevel.LowPriority, runCallbackFn));
  }
}

function init(thunk: VNode) {
  (thunk as any).data.state = {
    setup: false,
    states: [],
    statesIndex: 0,
    depsStates: [],
    depsIndex: 0,
    updates: [],
    cleanups: new Map()
  };
  let vnode = runComponent(thunk);
  copyToComponent(vnode, thunk);
}

function update(_: VNode, vnode: VNode) {
  const prevState = currentState;
  currentState = (vnode as any).data.state;
  try {
    (vnode as any).data.state.updates.forEach(call);
  } finally {
    Object.assign((vnode as any).data.state, {
      setup: true,
      updates: [],
      depsIndex: 0,
      statesIndex: 0,
    });
    currentState = prevState;
  }
}

function destroy(vnode: VNode) {
  const prevState = currentState;
  currentState = (vnode as any).data.state;
  const xs = Array.from((vnode as any).data.state.cleanups.values());
  try {
    xs.forEach(call);
  } finally {
    currentState = prevState;
  }
}

export function prepatch(oldVnode: VNode, thunk: VNode) {
  let old = oldVnode.data as VNodeData, cur = thunk.data as VNodeData;
  if (old.render === cur.render) {
    (thunk as any).data.state = (oldVnode as any).data.state
    update(oldVnode, thunk);
    copyToComponent(runComponent(thunk), thunk);
    return;
  }
  destroy(oldVnode);
  init(thunk);
}

function render(vnode: VNode, args: any[] = []) {
  const prevState = currentState;
  currentState = (vnode as any).data.state;
  const cur = vnode.data as VNodeData;
  try {
    return (cur.fn as any).apply(undefined, [cur.emit].concat(args));
  } finally {
    currentState = prevState;
  }
}

export function stateful(sel: string, fn: Function, emit: Function, args: any[], key?: Key): VNode {
  return CreateVNode(sel, {
    key,
    hook: {init, prepatch},
    fn: fn,
    emit: emit,
    args: args
  }, undefined, undefined, undefined);
}

function runComponent(thunk: VNode) {
  const cur = thunk.data as VNodeData;
  let vnode = render(thunk, cur.args);
  return vnode;
}

export function copyToComponent(vnode: VNode, thunk: VNode): void {
  thunk.elm = vnode.elm;
  (vnode.data as VNodeData).hook = {
    ...(vnode.data && vnode.data.hook ? vnode.data.hook : {}),
    destroy: destroy
  };
  (vnode.data as VNodeData).render = (thunk.data as VNodeData).render;
  (vnode.data as VNodeData).args = (thunk.data as VNodeData).args;
  (vnode.data as VNodeData).emit = (thunk.data as VNodeData).emit;
  thunk.data = vnode.data;
  thunk.children = vnode.children;
  thunk.text = vnode.text;
  thunk.elm = vnode.elm;
}

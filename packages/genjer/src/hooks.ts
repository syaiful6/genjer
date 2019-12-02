import {VNode, Thunk, VNodeData, mutmapVNode} from './vnode';
import {vnode as CreateVNode} from 'snabbdom/vnode';
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

function init(thunk: VNode<any>) {
  (thunk as any).state = {
    setup: false,
    states: [],
    statesIndex: 0,
    depsStates: [],
    depsIndex: 0,
    updates: [],
    cleanups: new Map()
  };
  let vnode = runComponent(thunk as Thunk<any>);
  copyToComponent(vnode, thunk);
}

function update(_: VNode<any>, vnode: VNode<any>) {
  const prevState = currentState;
  currentState = (vnode as any).state;
  try {
    (vnode as any).state.updates.forEach(call);
  } finally {
    Object.assign((vnode as any).state, {
      setup: true,
      updates: [],
      depsIndex: 0,
      statesIndex: 0,
    });
    currentState = prevState;
  }
}

function destroy(vnode: VNode<any>) {
  const prevState = currentState;
  currentState = (vnode as any).state;
  const xs = Array.from((vnode as any).state.cleanups.values());
  try {
    xs.forEach(call);
  } finally {
    currentState = prevState;
  }
}

export function prepatch(oldVnode: VNode<any>, thunk: VNode<any>) {
  let old = oldVnode.data as VNodeData<any>, cur = thunk.data as VNodeData<any>;
  if (old.render === cur.render) {
    (thunk as any).state = (oldVnode as any).state
    update(oldVnode, thunk);
    copyToComponent(runComponent(thunk as Thunk<any>), thunk);
    return;
  }
  destroy(oldVnode);
  init(thunk);
}

function render(vnode: VNode<any>, args: any[] = []) {
  const prevState = currentState;
  currentState = (vnode as any).state;
  const cur = vnode.data as VNodeData<any>;
  try {
    return (cur.render as any).apply(undefined, args);
  } finally {
    currentState = prevState;
  }
}

export function stateful(sel: string, fn: Function, args: any[], key?: string): Thunk<any> {
  return CreateVNode(sel, {
    key,
    cofn: id,
    hook: {init, prepatch},
    render: fn,
    args: args
  }, undefined, undefined, undefined) as Thunk<any>;
}

function runComponent(thunk: Thunk<any>) {
  const cur = thunk.data as VNodeData<any>;
  let vnode = render(thunk, cur.args);
  mutmapVNode(cur.cofn as any, vnode, false);
  return vnode;
}

export function copyToComponent(vnode: VNode<any>, thunk: VNode<any>): void {
  thunk.elm = vnode.elm;
  (vnode.data as VNodeData<any>).hook = {
    ...(vnode.data && vnode.data.hook ? vnode.data.hook : {}),
    destroy: destroy
  };
  (vnode.data as VNodeData<any>).view = (thunk.data as VNodeData<any>).view;
  (vnode.data as VNodeData<any>).render = (thunk.data as VNodeData<any>).render;
  (vnode.data as VNodeData<any>).args = (thunk.data as VNodeData<any>).args;
  (vnode.data as VNodeData<any>).cofn = (thunk.data as VNodeData<any>).cofn;
  thunk.data = vnode.data;
  thunk.children = vnode.children;
  thunk.text = vnode.text;
  thunk.elm = vnode.elm;
}

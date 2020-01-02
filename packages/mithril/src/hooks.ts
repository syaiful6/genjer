import {Children, ChildArrayOrPrimitive, Component, Vnode} from 'mithril';
import {scheduleSyncCallback} from '@genjer/genjer';

import {resolveCurrentSignal} from './signal';

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

function id<A>(a: A) {
  return a;
}

const call = /*#__PURE__*/ Function.prototype.call.bind(
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

type UpdateFn<S = any> = (s: S | ((_: S) => S), ix: number) => S;
export interface SetStateFn<S> {
  (_: S): void;
  (_: (_: S) => S): void;
}

function updateState<S = any>(initialValue?: S, newValueFn: UpdateFn = id): [S, SetStateFn<S>, number]  {
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
        signal.emit(); // rerender
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

const effect = (isAsync: boolean = false) => (fn: EffectFn, deps: any[]) => {
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
        state.cleanups.set("_", signal.emit);
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

    state.updates.push(
      isAsync ? () => scheduleSyncCallback(runCallbackFn) : runCallbackFn
    );
  }
}

export const useEffect = /*#__PURE__*/ effect(true);

export const useLayoutEffect = /*#__PURE__*/ effect();

export function useRef<T>(initialValue: T): {current: T} {
  const [value] = updateState({ current: initialValue });
  return value;
}

export function useMemo<T>(fn: () => T, deps: any[]): T {
  const state = currentState;
  const shouldRecompute = updateDeps(deps);
  const [memoized, setMemoized] = !state.setup ? updateState(fn()) : updateState<T>();
  if (state.setup && shouldRecompute) {
    setMemoized(fn());
  }
  return memoized;
}

export function useCallback<
  ResultFn extends (this: any, ...newArgs: any[]) => ReturnType<ResultFn>
>(resultFn: ResultFn, deps: any[]): ResultFn {
  return useMemo(() => resultFn, deps);
}

type BaseProps = {
  children?: ChildArrayOrPrimitive;
  vnode?: Vnode<any, any>;
}

export type FunctionComponent<Props = {}> = (props: Props & BaseProps) => Children | null | void;

function init(this: HookedState, vnode: Vnode<any, HookedState>) {
  Object.assign(vnode.state, {
    setup: false,
    states: [],
    statesIndex: 0,
    depsStates: [],
    depsIndex: 0,
    updates: [],
    cleanups: new Map()
  });
}

function update(vnode: Vnode<any, HookedState>) {
  const prevState = currentState;
  currentState = vnode.state;
  try {
    vnode.state.updates.forEach(call);
  } finally {
    Object.assign(vnode.state, {
      setup: true,
      updates: [],
      depsIndex: 0,
      statesIndex: 0,
    });
    currentState = prevState;
  }
}

function teardown(vnode: Vnode<any, HookedState>) {
  const prevState = currentState;
  currentState = vnode.state;
  try {
    vnode.state.cleanups.forEach(call);
  } finally {
    currentState = prevState;
  }
}

export function withHooks<Attrs = {}>(
  component: FunctionComponent<Attrs>,
  initialProps?: Partial<Attrs>
): Component<Attrs, HookedState> {
  function render(this: HookedState, vnode: Vnode<Attrs, HookedState>): Children | null | void {
    const prevState = currentState;
    currentState = vnode.state;
    vnode.children
    try {
      return component({
        ...initialProps,
        ...vnode.attrs,
        vnode,
        children: vnode.children,
      });
    } catch (e) {
      console.error(e);
    } finally {
      currentState = prevState
    }
  }

  return {
    oninit: init,
    oncreate: update,
    onupdate: update,
    view: render,
    onremove: teardown,
  };
}

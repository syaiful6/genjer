import {Module} from 'snabbdom/modules/module';
import {VNode} from 'snabbdom/vnode';
import {init as initRender} from 'snabbdom'
import { Either, left, right } from '@jonggrang/prelude';
import {Loop, EventQueue, withAccum, fix} from './event-queue';
import {mergeInterpreter, interpretNever} from './interpreter'
import {purely} from './transition'
import {Transition, Batch} from './types';
import {recordValues} from './utils';
import {currentSignal, makeSignal, Signal} from './signal';
import {scheduleSyncCallback} from './sync-schedule';
import {scheduleCallback, PriorityLevel} from './scheduler';

/**
 * Dispatch send an action to application reducer.
 */
export interface Dispatch<A> {
  (a: A): void;
}

export interface App<F, G, S, A> {
  render: (dispatch: Dispatch<A>, model: S) => VNode;
  update: (model: S, action: A) => Transition<F, S, A>;
  subs: (model: S) => Batch<G, A>;
  init: Transition<F, S, A>;
}

export interface AppInstance<S, A> {
  push: (a: A) => void;
  run: () => void;
  snapshot: () => S;
  restore: (s: S) => void;
  subscribe: (f: (c: AppChange<S, A>) => void) => () => void;
}

export interface AppChange<S, A> {
  old: S;
  action: A;
  model: S;
}

export const enum AppActionType {
  RESTORE,
  ACTION,
  INTERPRET,
  RENDER,
  FORCERENDER
}

const enum RenderStatus {
  NOCHANGE,
  PENDING,
  FLUSHED
}

type AppAction<M, Q, S, I>
  = { tag: AppActionType.RESTORE; payload: S }
  | { tag: AppActionType.ACTION; payload: I }
  | { tag: AppActionType.INTERPRET; payload: Either<M, Q> }
  | { tag: AppActionType.RENDER }
  | { tag: AppActionType.FORCERENDER };

type AppState<M, Q, S, I> = {
  model: S;
  interpret: Loop<Either<M, Q>>;
  status: RenderStatus;
  vdom: VNode;
};

export type MakeAppOptions = {
  modules: Partial<Module>[];
}

const enum ExecutionContext {
  NoWork = 0b00000000,
  Run    = 0b00000001,
  Render = 0b00000010
}

export function makeAppQueue<M, Q, S, I>(
  onChange: (c: AppChange<S, I>) => void,
  interpreter: EventQueue<Either<M, Q>, I>,
  app: App<M, Q, S, I>,
  el: Element,
  options?: Partial<MakeAppOptions>
): EventQueue<AppAction<M, Q, S, I>, AppAction<M, Q, S, I>> {
  return withAccum(self => {
    const opts: Partial<MakeAppOptions> = options || {};
    const patch = initRender(opts.modules || []);
    let ourSignal = makeSignal();
    let executionContext: number = ExecutionContext.NoWork;

    ourSignal.subscribe(pushForce);

    function pushAction(a: I) {
      return self.push({ tag: AppActionType.ACTION, payload: a });
    }

    function pushEffect(eff: M) {
      self.push({ tag: AppActionType.INTERPRET, payload: left(eff) });
    }

    function pushForce() {
      self.push({ tag: AppActionType.FORCERENDER });
      if ((executionContext & ExecutionContext.Run) !== ExecutionContext.Run) {
        scheduleCallback(PriorityLevel.NormalPriority, self.run);
        executionContext |= ExecutionContext.Run;
      }
    }

    function runSubs(lo: Loop<Either<M, Q>>, subs: Q[]) {
      for (let i = 0, len = subs.length; i < len; i++) {
        lo = lo.loop(right(subs[i]));
      }
      return lo;
    }

    function pushRender() {
      self.push({ tag: AppActionType.RENDER });
      if ((executionContext & ExecutionContext.Run) !== ExecutionContext.Run) {
        scheduleCallback(PriorityLevel.ImmediatePriority, self.run);
        executionContext |= ExecutionContext.Run;
      }
    }

    function update(state: AppState<M, Q, S, I>, action: AppAction<M, Q, S, I>): AppState<M, Q, S, I> {
      let next: Transition<M, S, I>,
        status: RenderStatus,
        vdom: VNode,
        nextState: AppState<M, Q, S, I>,
        appChange: AppChange<S, I>,
        prevSignal: Signal | null;
      switch(action.tag) {
      case AppActionType.INTERPRET:
        return {...state, interpret: state.interpret.loop(action.payload)}

      case AppActionType.ACTION:
        next = app.update(state.model, action.payload);
        status = nextStatus(state.model, next.model, state.status);
        nextState = {...state, model: next.model, status}
        appChange = {old: state.model, action: action.payload, model: nextState.model};
        onChange(appChange);
        forInFn(next.effects, pushEffect);
        return nextState;

      case AppActionType.RESTORE:
        status = nextStatus(state.model, action.payload, state.status);
        return {...state, status, model: action.payload};

      case AppActionType.FORCERENDER:
        return {...state, status: RenderStatus.PENDING}

      case AppActionType.RENDER:
        // during render use switch current signal
        prevSignal = currentSignal.current;
        currentSignal.current = ourSignal;
        vdom = patch(state.vdom, app.render(emit, state.model));
        currentSignal.current = prevSignal;
        if ((executionContext & ExecutionContext.Render) === ExecutionContext.Render) {
          executionContext ^= ExecutionContext.Render;
        }
        return {...state, vdom, status: RenderStatus.FLUSHED};
      }
    }

    function commit(state: AppState<M, Q, S, I>): AppState<M, Q, S, I> {
      if ((executionContext & ExecutionContext.Run) === ExecutionContext.Run) {
        executionContext ^= ExecutionContext.Run;
      }
      if (state.status === RenderStatus.FLUSHED) {
        return {...state, status: RenderStatus.NOCHANGE};
      }
      if (state.status === RenderStatus.PENDING) {
        if ((executionContext & ExecutionContext.Render) !== ExecutionContext.Render) {
          scheduleCallback(PriorityLevel.ImmediatePriority, pushRender);
          executionContext |= ExecutionContext.Render;
        }
      }

      const tickInterpret = runSubs(state.interpret, app.subs(state.model));
      return {...state, interpret: tickInterpret, status: RenderStatus.NOCHANGE};
    }

    function emit(a: I) {
      pushAction(a);
      if ((executionContext & ExecutionContext.Run) !== ExecutionContext.Run) {
        scheduleCallback(PriorityLevel.UserBlockingPriority, self.run);
        executionContext |= ExecutionContext.Run;
      }
    }

    const prevSignal = currentSignal.current;
    currentSignal.current = ourSignal;
    const vdom = patch(el, app.render(emit, app.init.model));
    currentSignal.current = prevSignal;

    const it2 = interpreter({...self, push: pushAction});
    forInFn(app.init.effects, pushEffect);

    let st: AppState<M, Q, S, I> = {
      vdom,
      status: RenderStatus.NOCHANGE,
      interpret: it2,
      model: app.init.model
    };
    return {update, commit, init: st}
  });
}

interface SubscriptionState<S, I> {
  fresh: number;
  cbs: Record<string, (_: AppChange<S, I>) => void>;
}

export function make<M, Q, S, I>(
  interpreter: EventQueue<Either<M, Q>, I>,
  app: App<M, Q, S, I>,
  el: Element,
  options?: Partial<MakeAppOptions>
): AppInstance<S, I> {
  let subs: SubscriptionState<S, I> = {fresh: 0, cbs: {}};
  let state: S = app.init.model;

  function handleChange(ac: AppChange<S, I>): void {
    scheduleCallback(PriorityLevel.NormalPriority, () => {
      state = ac.model;
      let fns = recordValues(subs.cbs);
      for (let i = 0, len = fns.length; i < len; i++) {
        fns[i](ac);
      }
    });
  }

  function subscribe(cb: (_: AppChange<S, I>) => void): () => void {
    let nkey = subs.fresh.toString();
    subs.fresh = subs.fresh + 1;
    subs.cbs[nkey] = cb;

    return () => {
      delete subs.cbs[nkey];
    };
  }

  let queue = fix(makeAppQueue(handleChange, interpreter, app, el, options));

  function push(i: I) {
    queue.push({tag: AppActionType.ACTION, payload: i });
  }

  function run() {
    scheduleSyncCallback(queue.run);
  }

  return {
    subscribe,
    push,
    run,
    snapshot: () => state,
    restore: (s: S) => {
      queue.push({tag: AppActionType.RESTORE, payload: s});
    },
  }
}

function nextStatus<S>(prev: S, next: S, status: RenderStatus): RenderStatus {
  switch (status) {
  case RenderStatus.NOCHANGE:
    return prev === next ? RenderStatus.NOCHANGE : RenderStatus.PENDING;
  case RenderStatus.FLUSHED:
    return RenderStatus.NOCHANGE;
  case RenderStatus.PENDING:
    return RenderStatus.PENDING;
  }
}

export type PureApp<S, A> = {
  render: (dispatch: Dispatch<A>, model: S) => VNode;
  update: (model: S, action: A) => S;
  init: S;
}

export function makePureApp<S, A>(app: PureApp<S, A>, el: Element, opts?: Partial<MakeAppOptions>) {
  return make(
    mergeInterpreter(interpretNever(), interpretNever()),
    liftPureApp(app),
    el,
    opts
  )
}

export function liftPureApp<S, A>(app: PureApp<S, A>): App<never, never, S, A> {
  return {
    render: app.render,
    update: (model, action) => purely(app.update(model, action)),
    init: purely(app.init),
    subs: () => [],
  }
}

function forInFn<A, B>(xs: A[], f: (a: A) => void): void {
  for (let i = 0, len = xs.length; i < len; i++) {
    f(xs[i]);
  }
}

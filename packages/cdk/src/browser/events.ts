import {withAccumArray, EventQueueInstance, Loop} from '@genjer/genjer';

export const enum GlobalNode {
  DOCUMENT,
  WINDOW
}

type UnbindFn = () => void;

export type EventOptions = AddEventListenerOptions | boolean;

export class EventSub<A> {
  constructor(readonly node: GlobalNode, readonly name: string, readonly fn: (ev: Event) => A, readonly options?: EventOptions) {
  }

  map<B>(fn: (_: A) => B): EventSub<B> {
    return new EventSub(this.node, this.name, (event) => fn(this.fn(event)), this.options);
  }
}

/**
 * bind an event in root element: `document` or `window`.
 * @type {GlobalNode}
 */
export function onGlobalEvent<A>(node: GlobalNode, name: string, fn: (ev: Event) => A, options?: EventOptions): EventSub<A> {
  return new EventSub(node, name, fn, options);
}

/**
 * Register/bind an event on document
 */
export function onDocument<A>(name: string, fn: (ev: Event) => A, options?: EventOptions): EventSub<A> {
  return onGlobalEvent(GlobalNode.DOCUMENT, name, fn, options);
}

/**
 * Register/bind an event on document
 */
export function onWindow<A>(name: string, fn: (ev: Event) => A, options?: EventOptions): EventSub<A> {
  return onGlobalEvent(GlobalNode.WINDOW, name, fn, options);
}

function bindEvents<A>(queue: EventQueueInstance<A>, bindings: EventSub<A>[]): UnbindFn {
  const unbindings: UnbindFn[] = bindings.map(binding => {
    function handler(ev: Event) {
      queue.push(binding.fn(ev));
      queue.run();
    }

    const elem = binding.node === GlobalNode.DOCUMENT ? document : window;

    elem.addEventListener(binding.name, handler, binding.options);

    return () => {
      elem.removeEventListener(binding.name, handler, binding.options);
    };
  });

  return () => {
    unbindings.forEach(unbind => unbind());
  };
}

/**
 * The interpreter for `EventSub` command.
 */
export function createDOMEventInterpreter(): <A>(queue: EventQueueInstance<A>) => Loop<EventSub<A>> {
  function subs<A>(queue: EventQueueInstance<A>) {
    let unbindFn: UnbindFn | null = null;

    return function commit(xs: EventSub<A>[]) {
      if (unbindFn != null) {
        unbindFn();
        unbindFn = null;
      }
      if (xs.length > 0) {
        unbindFn = bindEvents(queue, xs);
      }
    }
  }

  return withAccumArray(subs);
}

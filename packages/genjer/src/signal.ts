/**
 *
 */
export interface Signal<A> {
  subscribe: (f: (_: A) => void) => () => void;
  push: (_: A) => void;
  snapshot: () => A;
}

export type CurrentSignal = {
  current: Signal<any> | null;
}

export const currentSignal: CurrentSignal = {
  current: null
}

export function makeSignal<A>(initial: A): Signal<A> {
  let fresh: number = 0;
  let cbs: Record<string, (_: A) => void> = {};
  let val = initial;
  return {
    subscribe: (cb) => {
      let key = fresh.toString();
      fresh++;
      cbs[key] = cb;
      return () => {
        delete cbs[key];
      }
    },
    push: (a: A) => {
      val = a;
      Object.keys(cbs).forEach(key => {
        if (typeof cbs[key] === 'function') cbs[key](a)
      })
    },
    snapshot: () => val
  };
}

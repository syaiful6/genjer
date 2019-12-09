/**
 *
 */
export interface Signal {
  subscribe: (f: () => void) => () => void;
  emit: () => void;
}

export type CurrentSignal = {
  current: Signal | null;
}

export const currentSignal: CurrentSignal = {
  current: null
}

export function makeSignal(): Signal {
  let fresh: number = 0;
  let cbs: Record<string, () => void> = {};
  return {
    subscribe: (cb) => {
      let key = fresh.toString();
      fresh++;
      cbs[key] = cb;
      return () => {
        delete cbs[key];
      }
    },
    emit: () => {
      Object.keys(cbs).forEach(key => {
        if (typeof cbs[key] === 'function') cbs[key]()
      });
    },
  };
}

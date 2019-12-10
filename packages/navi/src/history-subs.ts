import {Location, Action, History, LocationListener} from 'history'
import {liftVariant, Variant, withAccumArray, EventQueue} from '@genjer/genjer';

export type HistoryChangeListener<A> = (location: Location, action: Action) => A;

export class HistorySub<A> {
  constructor(
    readonly fn: HistoryChangeListener<A>
  ) {
  }

  map<B>(f: (_: A) => B): HistorySub<B> {
    return new HistorySub((location, action) => f(this.fn(location, action)));
  }
}

export function onHistoryChange<A>(fn: HistoryChangeListener<A>): Variant<'navi', A> {
  return liftVariant('navi', new HistorySub(fn));
}

export function makeHistorySubInterpreter<A = any>(history: History): EventQueue<HistorySub<A>, A> {
  return withAccumArray(queue => {
    let model: Array<HistorySub<A>>;
    let unsubscribe: (() => void) | null = null;
    // subscribe
    let listener: LocationListener = (location, action) => {
      for (let i = 0, len = model.length; i < len; i++) {
        queue.push(model[i].fn(location, action));
      }
      queue.run();
    };

    function commit(xs: Array<HistorySub<A>>) {
      let old = model;
      model = xs;
      if (xs.length > 0 && old.length === 0) {
        unsubscribe = history.listen(listener);
      }
      if (xs.length === 0 && old.length > 0) {
        if (unsubscribe != null) {
          unsubscribe();
        }
        unsubscribe = null;
      }
    }

    return commit;
  });
}

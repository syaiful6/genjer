export type Loop<I> = {
  loop: (i: I) => Loop<I>;
  tick: () => Loop<I>;
}

export type EventQueueInstance<O> = {
  run: () => void;
  push: (o: O) => void;
}

export type EventQueue<I, O> = (o: EventQueueInstance<O>) => Loop<I>;

export type EventQueueAccum<S, I> = {
  init: S;
  update: (s: S, i: I) => S;
  commit: (s: S) => S;
}

export function stepper<I, O>(k: (i: I) => O): EventQueue<I, O> {
  return (next) => {
    function tick(): Loop<I> {
      return {loop, tick};
    }

    function loop(i: I): Loop<I> {
      next.push(k(i));
      next.run();
      return {loop, tick};
    }

    return tick();
  };
}

export function withCont<I, O>(k: (eo: EventQueueInstance<O>, i: I) => void): EventQueue<I, O> {
  return (next) => {
    function tick(): Loop<I> {
      return {loop, tick};
    }

    function loop(i: I): Loop<I> {
      k(next, i);
      return {loop, tick};
    }

    return tick();
  };
}

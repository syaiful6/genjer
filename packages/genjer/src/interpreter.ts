import {Either, isLeft} from '@jonggrang/prelude';
import {EventQueue, Loop, stepper, withCont} from './event-queue';

export function mergeInterpreter<F, G, I>(lhs: EventQueue<F, I>, rhs: EventQueue<G, I>): EventQueue<Either<F, G>, I> {
  return (queue) => {
    function tick(ls: Loop<F>, rs: Loop<G>): Loop<Either<F, G>> {
      return {loop: update(ls, rs), tick: commit(ls, rs)};
    }

    function update(ls: Loop<F>, rs: Loop<G>) {
      return function (e: Either<F, G>): Loop<Either<F, G>> {
        return isLeft(e) ? tick(ls.loop(e.value), rs) : tick(ls, rs.loop(e.value));
      };
    }

    function commit(ls: Loop<F>, rs: Loop<G>): () => Loop<Either<F, G>> {
      return () => tick(ls.tick(), rs.tick())
    }

    return tick(lhs(queue), rhs(queue));
  };
}

export type RowInterpreter<I> = {
  [name: string]: EventQueue<any, I>;
}

type RowLoop<I> = {
   [name: string]: Loop<I>;
}

/**
 * Take a records of interpreters and returns EventQueue
 */
export function rowInterpreter<I, T extends RowInterpreter<I>>(interpreter: T): EventQueue<{tag: keyof T; value: any}, I> {
  return (queue) => {

    function tick(loops: RowLoop<any>) {
      return {loop: update(loops), tick: commit(loops)};
    }

    function update(loops: RowLoop<any>) {
      return (input: {tag: keyof T; value: any}) => {
        let result: RowLoop<any> = {...loops, [input.tag]: (loops as any)[input.tag](input.value)};

        return tick(result);
      }
    }

    function commit(loops: RowLoop<any>) {
      return () => {
        let result: RowLoop<any> = {};
        Object.keys(loops).forEach(key => {
          result[key] = loops[key].tick();
        });

        return tick(result);
      };
    }

    let result: RowLoop<any> = {};
    Object.keys(interpreter).forEach(key => {
      result[key] = interpreter[key](queue);
    });

    return tick(result);
  };
}

export function interpretNever<A>(): EventQueue<never, A> {
  return stepper(() => { throw new Error('never interpreter received input') });
}

export function liftCont<F, I>(k: (fi: F, c: (j: I) => void) => void): EventQueue<F, I> {
  return withCont((queue, f) => {
    k(f, j => {
      queue.push(j);
      queue.run();
    });
  });
}

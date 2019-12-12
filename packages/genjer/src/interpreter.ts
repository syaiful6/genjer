import {Either, isLeft} from '@jonggrang/prelude';
import {EventQueue, Loop, stepper, withCont} from './event-queue';
import {Variant} from './variant';

export function mergeInterpreter<F, G, I>(lhs: EventQueue<F, I>, rhs: EventQueue<G, I>): EventQueue<Either<F, G>, I> {
  return (queue) => {
    let ls = lhs(queue);
    let rs = rhs(queue);

    function loop(e: Either<F, G>): Loop<Either<F, G>> {
      if (isLeft(e)) {
        ls = ls.loop(e.value);
      } else {
        rs = rs.loop(e.value);
      }

      return {loop, done};
    }

    function done(): Loop<Either<F, G>> {
      ls = ls.done();
      rs = rs.done();

      return {loop, done};
    }

    return {loop, done}
  };
}

export type RowInterpreter<T = any> = {
  [P in keyof T]: T[P] & EventQueue<any, any>
}

type RowLoop<I> = {
   [name: string]: Loop<I>;
}

type InferOut<T extends Record<any, EventQueue<any, any>>> = T extends Record<any, EventQueue<any, infer P>> ? P : never;

/**
 * Take a records of interpreters and returns EventQueue
 */
export function rowInterpreter<
  K extends keyof T & string,
  T extends RowInterpreter
 >(interpreter: T): EventQueue<Variant<K, InferOut<T>>, InferOut<T>> {
  return (queue) => {

    let loops: RowLoop<any> = {};
    Object.keys(interpreter).forEach(key => {
      loops[key] = (interpreter as any)[key](queue);
    });

    function loop(input: Variant<K, any>): Loop<Variant<K, any>> {
      loops = {...loops, [input.tag]: (loops as any)[input.tag](input.fa)};

      return {loop, done};
    }

    function done() {
      let result: RowLoop<any> = {};
      Object.keys(loops).forEach(key => {
        result[key] = loops[key].done();
      });

      loops = result;

      return {loop, done};
    }

    return {loop, done};
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

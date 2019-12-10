import {Functor} from './types';

/**
 * This functor implements a polymorphic variants, this is usefull to combine our
 * effect
 */
export class Variant<T extends string, A> {
  constructor(readonly tag: T, readonly fa: Functor<A>) {
  }

  /**
   * functor implementation
   */
  map<B>(f: (_: A) => B): Variant<T, B> {
    return new Variant(this.tag, this.fa.map(f));
  }
}

/**
 * lift a functor to a variant with the given tag
 */
export function liftVariant<T extends string, A = any>(tag: T, fa: Functor<A>): Variant<T, A> {
  return new Variant(tag, fa);
}

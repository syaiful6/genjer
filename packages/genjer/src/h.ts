import {VNode, VNodeData, thunk} from './vnode';
import * as H from 'snabbdom/h';
import {stateful as withStateful} from './hooks';

export { VNode } from './vnode';
export type VNodes<A> = Array<VNode<A>>;
export type VNodeChildElement<A> = VNode<A> | string | number | undefined | null;
export type ArrayOrElement<T> = T | T[];
export type VNodeChildren<A> = ArrayOrElement<VNodeChildElement<A>>;

export function h<A = any>(sel: string): VNode<A>;
export function h<A = any>(sel: string, data: VNodeData<A>): VNode<A>;
export function h<A = any>(sel: string, children: VNodeChildren<A>): VNode<A>;
export function h<A = any>(sel: string, data: VNodeData<A>, children: VNodeChildren<A>): VNode<A>;
export function h<A = any>(sel: any, b?: any, c?: any): VNode<A> {
  return H.h(sel, b, c) as VNode<A>;
}

export function stateful<S, A = any>(
  sel: string, st: S, fn: (_: S) => VNode<A>, key?: string
): VNode<A> {
  return withStateful(sel, fn, [st], key);
}

export function stateful2<S, T, A = any>(
  sel: string, a: S, b: T, fn: (a: S, b: T) => VNode<A>, key?: string
): VNode<A> {
  return withStateful(sel, fn, [a, b], key);
}

export function stateful3<S, T, U, A = any>(
  sel: string, a: S, b: T, c: U, fn: (a: S, b: T) => VNode<A>, key?: string
): VNode<A> {
  return withStateful(sel, fn, [a, b, c], key);
}

export function stateful4<S, T, U, V, A = any>(
  sel: string, a: S, b: T, c: U, d: V, fn: (a: S, b: T) => VNode<A>, key?: string
): VNode<A> {
  return withStateful(sel, fn, [a, b, c, d], key);
}

export function lazy<S, A = any>(
  sel: string, st: S, fn: (_: S) => VNode<A>, key?: string | undefined
): VNode<A> {
  return thunk(sel, key, fn, [st]);
}

export function lazy2<S, T, A = any>(
  sel: string, a: S, b: T,
  fn: (a: S, b: T) => VNode<A>, key?: string | undefined
): VNode<A> {
  return thunk(sel, key, fn, [a, b]);
}

export function lazy3<S, T, U, A = any>(
  sel: string, a: S, b: T, c: U,
  fn: (a: S, b: T, c: U) => VNode<A>, key?: string | undefined
): VNode<A> {
  return thunk(sel, key, fn, [a, b, c]);
}

export function lazy4<S, T, U, V, A = any>(
  sel: string, a: S, b: T, c: U, d: V,
  fn: (a: S, b: T, c: U, d: V) => VNode<A>, key?: string | undefined
): VNode<A> {
  return thunk(sel, key, fn, [a, b, c, d]);
}

import {VNode, Key} from 'snabbdom/vnode';
import {thunk} from './thunk';
import {Dispatch} from './genjer';
import {stateful as withStateful} from './hooks';

export function stateful<S, A = any>(
  sel: string,
  fn: (a: Dispatch<A>, s: S) => VNode,
  emit: Dispatch<A>,
  st: S,
  key?: Key
): VNode {
  return withStateful(sel, fn, emit, [st], key);
}

export function stateful2<S, T, A = any>(
  sel: string,
  fn: (emit: Dispatch<A>, a: S, b: T) => VNode,
  emit: Dispatch<A>,
  a: S,
  b: T,
  key?: Key
): VNode {
  return withStateful(sel, fn, emit, [a, b], key);
}

export function stateful3<S, T, U, A = any>(
  sel: string,
  fn: (emit: Dispatch<A>, a: S, b: T, c: U) => VNode,
  emit: Dispatch<A>,
  a: S,
  b: T,
  c: U,
  key?: Key
): VNode {
  return withStateful(sel, fn, emit, [a, b, c], key);
}

export function stateful4<S, T, U, V, A = any>(
  sel: string,
  fn: (emit: Dispatch<A>, a: S, b: T, c: U) => VNode,
  emit: Dispatch<A>,
  a: S,
  b: T,
  c: U,
  d: V,
  key?: Key
): VNode {
  return withStateful(sel, fn, emit, [a, b, c, d], key);
}

export function lazy<S, A = any>(
  sel: string,
  fn: (a: Dispatch<A>, s: S) => VNode,
  emit: Dispatch<A>,
  st: S,
  key?: Key
): VNode {
  return thunk(sel, fn, emit, [st], key);
}

export function lazy2<S, T, A = any>(
  sel: string,
  fn: (emit: Dispatch<A>, a: S, b: T) => VNode,
  emit: Dispatch<A>,
  a: S,
  b: T,
  key?: Key
): VNode {
  return thunk(sel, fn, emit, [a, b], key);
}

export function lazy3<S, T, U, A = any>(
  sel: string,
  fn: (emit: Dispatch<A>, a: S, b: T, c: U) => VNode,
  emit: Dispatch<A>,
  a: S,
  b: T,
  c: U,
  key?: Key
): VNode {
  return thunk(sel, fn, emit, [a, b, c], key);
}

export function lazy4<S, T, U, V, A = any>(
  sel: string,
  fn: (emit: Dispatch<A>, a: S, b: T, c: U, d: V) => VNode,
  emit: Dispatch<A>,
  a: S,
  b: T,
  c: U,
  d: V,
  key?: Key
): VNode {
  return thunk(sel, fn, emit, [a, b, c, d], key);
}

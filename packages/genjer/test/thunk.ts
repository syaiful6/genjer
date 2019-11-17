import * as assert from 'assert';

import {h} from '../src/h';
import {thunk, VNode} from '../src/vnode';
import {initRender} from '../src/snabbdom'

function id<A>(a: A): A {
  return a;
}

describe('Thunk', () => {
  let elm: Element | VNode<any>;
  let patch: (old: Element | VNode<any>, vnode: VNode<any>) => VNode<any>;
  beforeEach(() => {
    elm = document.createElement('div');
    patch = initRender(id, []);
  });

  it('returns vnode with data and render function', () => {
    function numberInSpan(n: number) {
      return h('span', 'Number is ' + n);
    }
    var vnode = thunk('span', 'num', numberInSpan, [22]);
    assert.deepEqual(vnode.sel, 'span');
    assert.deepEqual(vnode.data.key, 'num');
    assert.deepEqual(vnode.data.args, [22]);
  });

  it('calls render function once on data change', () => {
    let called = 0;
    function numberInSpan(n: number) {
      called++;
      return h('span', {key: 'num'}, 'Number is ' + n);
    }
    let vnode1 = h('div', [
      thunk('span', 'num', numberInSpan, [1])
    ]);
    let vnode2 = h('div', [
      thunk('span', 'num', numberInSpan, [2])
    ]);
    patch(elm, vnode1);
    assert.equal(called, 1);
    patch(vnode1, vnode2);
    assert.equal(called, 2);
  });

  it('does not call render function on data unchanged', () => {
    let called = 0;
    function numberInSpan(n: number) {
      called++;
      return h('span', {key: 'num'}, 'Number is ' + n);
    }
    let vnode1 = h('div', [
      thunk('span', 'num', numberInSpan, [1])
    ]);
    let vnode2 = h('div', [
      thunk('span', 'num', numberInSpan, [1])
    ]);
    patch(elm, vnode1);
    assert.equal(called, 1);
    patch(vnode1, vnode2);
    assert.equal(called, 1);
  });

  it('calls render function once on data-length change', () => {
    let called = 0;
    function numberInSpan(n: number) {
      called++;
      return h('span', {key: 'num'}, 'Number is ' + n);
    }
    let vnode1 = h('div', [
      thunk('span', 'num', numberInSpan, [1])
    ]);
    let vnode2 = h('div', [
      thunk('span', 'num', numberInSpan, [1, 2])
    ]);
    patch(elm, vnode1);
    assert.equal(called, 1);
    patch(vnode1, vnode2);
    assert.equal(called, 2);
  });

  it('calls render function once on function change', () => {
    let called = 0;
    function numberInSpan(n: number) {
      called++;
      return h('span', {key: 'num'}, 'Number is ' + n);
    }
    function numberInSpan2(n: number) {
      called++;
      return h('span', {key: 'num'}, 'Number really is ' + n);
    }
    let vnode1 = h('div', [
      thunk('span', 'num', numberInSpan, [1])
    ]);
    let vnode2 = h('div', [
      thunk('span', 'num', numberInSpan2, [1])
    ]);
    patch(elm, vnode1);
    assert.equal(called, 1);
    patch(vnode1, vnode2);
    assert.equal(called, 2);
  });
});

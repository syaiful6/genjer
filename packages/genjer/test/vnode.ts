import * as assert from 'assert';

import {h, lazy} from '../src/h';
import {mapVNode, VNode} from '../src/vnode';
import {initRender} from '../src/snabbdom'

type TestEvent<A> = {
  tag: string;
  value: A;
};

interface PatchFn<A> {
  (old: Element | VNode<A>, vnode: VNode<A>): VNode<A>;
}

function mapClicked(ev: TestEvent<number>): TestEvent<string> {
  return { tag: ev.tag + '-mapped', value: ev.value.toString() };
}

describe('VNode', () => {
  let elm: Element | VNode<TestEvent<string>>;
  let results: TestEvent<string>[];
  function emit(e: TestEvent<string>) {
    results.push(e);
  }
  let patch: PatchFn<TestEvent<string>>;
  beforeEach(() => {
    elm = document.createElement('div');
    results = [];
    patch = initRender(emit);
  });

  it('Listener send event to emitter', () => {
    function handleClick(): TestEvent<string> {
      return {
        tag: 'click',
        value: 'clicked'
      };
    }
    let vnode = h('button', {events: {click: handleClick}}, 'btn');
    elm = patch(elm, vnode);
    let dom = elm.elm;
    (dom as any).click();
    assert.equal(results.length, 1);
    assert.deepEqual(results[0], {tag: 'click', value: 'clicked'});
  });

  it('can map Vnode', () => {
    function handleClick(): TestEvent<number> {
      return {
        tag: 'click',
        value: 10
      };
    }
    function handleElemRef(): TestEvent<number> {
      return {tag: 'created', value: 5};
    }
    let vnode = mapVNode(
      mapClicked,
      h('button', {events: {click: handleClick}, ref: {created: handleElemRef}}, 'btn')
    );
    let dom = patch(elm, vnode).elm;
    (dom as any).click();
    assert.equal(results.length, 2);
    assert.deepEqual(results[0], { tag: 'created-mapped', value: '5' });
    assert.deepEqual(results[1], { tag: 'click-mapped', value: '10' });
  });

  it('can map deep vnode', () => {
    function handleClick(): TestEvent<number> {
      return {
        tag: 'click',
        value: 10
      };
    }
    let vnode = mapVNode(
      mapClicked,
      h('div', [
        h('button', {events: {click: handleClick}}, 'btn')
      ])
    );
    let dom = patch(elm, vnode).elm;
    let btn = (dom as Element).querySelector('button');
    (btn as any).click();
    assert.equal(results.length, 1);
    assert.deepEqual(results[0], {tag: 'click-mapped', value: '10'});
  });

  it('Can map thunk', () => {
    function handleClick(): TestEvent<number> {
      return {
        tag: 'click',
        value: 10
      };
    }
    function renderBtn(num: number) {
      return h('button', {events: {click: handleClick}}, 'btn' + num);
    }
    let vnode1 = lazy('button', 2, renderBtn);
    let vnode2 = mapVNode(mapClicked, vnode1);
    let dom = patch(elm, vnode2).elm;
    (dom as any).click();
    assert.equal(results.length, 1);
    assert.deepEqual(results[0], {tag: 'click-mapped', value: '10'});
  });

  it('compose map', () => {
    function handleClick(): TestEvent<number> {
      return {
        tag: 'click',
        value: 10
      };
    }
    function addClicked(ev: TestEvent<number>): TestEvent<number> {
      return { tag: ev.tag, value: ev.value + 10 };
    }
    let vnode = h('button', {events: {click: handleClick}}, 'btn');
    let vnode2 = mapVNode(mapClicked, mapVNode(addClicked, vnode));
    let dom = patch(elm, vnode2).elm;
    (dom as any).click();
    assert.equal(results.length, 1);
    assert.deepEqual(results[0], {tag: 'click-mapped', value: '20'});
  });

  it('compose mapped functions (deep)', () => {
    function handleClick(): TestEvent<number> {
      return { tag: 'click', value: 10 };
    }
    function addClicked(ev: TestEvent<number>): TestEvent<number> {
      return { tag: ev.tag, value: ev.value + 10 };
    }
    let vnode = h('button', {events: {click: handleClick}}, 'btn');
    let vnode2 = h('div', mapVNode(addClicked, vnode));
    let vnode3 = mapVNode(mapClicked, vnode2);
    let dom = patch(elm, vnode3).elm;
    let btn = (dom as Element).querySelector('button');
    (btn as any).click();
    assert.equal(results.length, 1);
    assert.deepEqual(results[0], { tag: 'click-mapped', value: '20' });
  });
});

import * as assert from 'assert';

import {h} from 'snabbdom/h';
import ListenerModule from 'snabbdom/modules/eventlisteners';
import {stateful, useState, Dispatch, makePureApp} from '../src';

function counter(emit: Dispatch<number>) {
  const [count, setCount] = useState(0);
  return h('button', {
    on: {click: () => setCount(count + 1), dblclick: () => emit(count + 1)}
  }, count);
}

describe('useHooks', () => {
  function render(emit: Dispatch<any>, state: number) {
    return h('div', [
      stateful('button', counter, emit, []),
      h('span', state)
    ]);
  }
  function update(model: number, action: number): number {
    return model + action;
  }

  let elm: Element;
  beforeEach(() => {
    elm = document.createElement('div');
  });

  it('can render', () => {
    const app = makePureApp({render, update, init: 0}, elm, {modules: [ListenerModule]});
    app.run();
    const btn = elm.querySelector('button');

    assert.ok(btn);
    if (btn != null) {
      assert.equal(btn.textContent, '0');
    }
    assert.equal(app.snapshot(), 0);
  });

  it('can update the view on state change', (done) => {
    const app = makePureApp({render, update, init: 0}, elm, {modules: [ListenerModule]});
    app.run();
    const btn = elm.querySelector('button');

    assert.ok(btn);
    if (btn != null) {
      assert.equal(btn.textContent, '0');
      btn.click();
      setTimeout(() => {
        assert.equal(btn.textContent, '1');
        assert.equal(app.snapshot(), 0);
        done();
      }, 120);
    }
  });

  it('can update the view on state change (2)', (done) => {
    const app = makePureApp({render, update, init: 0}, elm, {modules: [ListenerModule]});
    app.run();
    const btn = elm.querySelector('button');

    assert.ok(btn);
    if (btn != null) {
      assert.equal(btn.textContent, '0');
      btn.click();

      setTimeout(() => {
        assert.equal(btn.textContent, '1');
        // dispatch dblclick
        const dispose = app.subscribe((change) => {
          assert.equal(change.model, 2);
          dispose();
          done();
        });

        const dblclickEvt = document.createEvent('MouseEvents');
        dblclickEvt.initEvent('dblclick');
        btn.dispatchEvent(dblclickEvt);
      }, 120);
    }
  });
});

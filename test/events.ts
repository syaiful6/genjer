import * as assert from 'assert';

import * as V from '../src/event';
import {runEvHandler} from '../src/vnode';

describe('Events helper', () => {
  it('always emit return constant value', () => {
    let lis = V.alwaysEmit(3);
    assert.equal(runEvHandler(lis, 3), 3);
  });

  it('onValueInput pass input value to handler', () => {
    let lis = V.onValueInput(x => x);
    let ev = {currentTarget: {value: 'value'}};
    assert.equal(runEvHandler(lis, ev as any), 'value');
  });

  it('onValueInput pass checked status to handler', () => {
    let lis = V.onChecked(x => x);
    let ev = {currentTarget: {checked: true}};
    assert.equal(runEvHandler(lis, ev as any), true);
  });

  it('onKey select key to be passed to handler', () => {
    function selectKeyOrEscape(key: string): key is 'Enter' | 'Escape' {
      return key === 'Enter' || key === 'Escape';
    }

    let lis = V.onKey(selectKeyOrEscape, x => x);
    assert.equal(runEvHandler(lis, {key: 'Enter'} as any), 'Enter');
    assert.ok(!runEvHandler(lis, {key: 'Space'} as any));
  });
});

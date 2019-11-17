import {init} from 'snabbdom';
import {h} from 'snabbdom/h';
import {VNode} from 'snabbdom/vnode';
import Attribute from 'snabbdom/modules/attributes';
import Props from 'snabbdom/modules/props';

import {CanvasModule, CommandType} from '../src';

const patch = init([Attribute, Props, CanvasModule]);

function render(): VNode {
  return h('canvas', {
    draw2d: [
      {type: CommandType.FUNCTION, name: 'fillRect', args: [25, 25, 100, 100]},
      {type: CommandType.FUNCTION, name: 'clearRect', args: [45, 45, 60, 60]},
      {type: CommandType.FUNCTION, name: 'strokeRect', args: [50, 50, 50, 50]},
    ]
  }, ['your browser didn\'t support canvas']);
}

function main() {
  let container = document.getElementById('container');
  if (container) patch(container, render());
}
requestAnimationFrame(main);

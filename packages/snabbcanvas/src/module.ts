import {VNode} from 'snabbdom/vnode';
import {Module} from 'snabbdom/modules/module';
import {Command, CommandType} from './types';

function drawCanvas(ctx: CanvasRenderingContext2D | null, cmds: Command[]): void {
  if (!ctx) return;
  let cmd: Command;
  for (let i = 0, len = cmds.length; i < len; i++) {
    cmd = cmds[i]
    if (cmd.type === CommandType.FIELD) {
      (ctx as any)[cmd.name] = cmd.value;
    } else {
      (ctx as any)[cmd.name](...cmd.args);
    }
  }
}

function isCanvasElement(el: Element): el is HTMLCanvasElement {
  return el && el.tagName === 'CANVAS' && typeof (el as any).getContext === 'function';
}

function onDrawHook(_: VNode, vnode: VNode): void {
  let elm: Element = vnode.elm as Element;
  let canvas: HTMLCanvasElement;
  if (!isCanvasElement(elm)) return;
  canvas = elm;

  let cmds: Command[] | undefined = vnode && vnode.data ? vnode.data.draw2d : undefined;
  if (cmds == null || !Array.isArray(cmds)) return;

  drawCanvas(canvas.getContext('2d'), cmds as Command[]);
}

export const canvas: Partial<Module> = {
  create: onDrawHook,
  update: onDrawHook,
}

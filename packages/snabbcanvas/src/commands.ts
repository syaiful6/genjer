import {CommandType, Command} from './types';

/**
 * Specifies the color or style to use inside shapes. The default is #000
 * (black). [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillStyle)
 * @param color
 */
export function fillStyle(color: string): Command {
  return field('fillStyle', color);
}

/**
 * Specifies the current text style being used when drawing text. This string
 * uses the same syntax as the [CSS font](https://developer.mozilla.org/en-US/docs/Web/CSS/font) specifier. The
 * default font is 10px sans-serif. [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font)
 * @param f
 */
export function font(f: string): Command {
  return field('font', f);
}

/**
 * Specifies the alpha value that is applied to shapes and images before they are
 * drawn onto the canvas.
 * @param alpha
 */
export function globalAlpha(alpha: number) {
  return field('globalAlpha', alpha);
}

/**
 * Call method on canvas context
 * @param name
 * @param args
 */
export function fn(name: string, ...args: any[]): Command {
  return command(CommandType.FUNCTION, name, args);
}

/**
 * Create field command:
 * `field('fillStyle', '#FF0000') == context.fillStyle = '#FF0000';`
 * @param name
 * @param value
 */
export function field(name: string, value: any): Command {
  return command(CommandType.FIELD, name, value);
}

/**
 * Lowest level, create a drawing command
 */
export function command(type: CommandType.FIELD, name: string, value: any): Command;
export function command(type: CommandType.FUNCTION, name: string, args: any[]): Command;
export function command(type: CommandType, name: string, valueOrArgs: any): Command {
  let value: any;
  let args: any[] | undefined;
  if (type === CommandType.FIELD) {
    value = valueOrArgs;
  } else {
    args = valueOrArgs;
  }

  return {type, name, value, args: args} as any;
}

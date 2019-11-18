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
export function globalAlpha(alpha: number): Command {
  return field('globalAlpha', alpha);
}

/**
 * Sets tye type of compositiong operation to apply when drawing new shapes
 * where type is 'GlobalCompositeOperationMode' string identifying which of the
 * compositiong or blending mode operation to use.
 */
export function globalCompositeOperation(mode: string): Command {
  return field('globalCompositeOperation', mode);
}

/**
 * Determines how the end points of every line are drawn.
 */
export function lineCap(cap: string): Command {
  return field('lineCap', cap);
}

/**
 * Sets the line dash pattern offset or "phase"
 */
export function lineDashOffset(value: number): Command {
  return field('lineDashOffset', value);
}

/**
 * Sets how two connectiong segments (of lines, arcs or curves) with non-zero
 * lengths in a shape are joined together (degenerate segments with zero lengths
 * whose specified endpoints and control points are exactly at the same position,
 * are skipped).
 */
export function lineJoin(join: string): Command {
  return field('lineJoin', join);
}

/**
 * sets the thickness of lines in space units. When setting, zero, negative,
 * Infinity and NaN values are ignored; otherwise the current value is set to
 * the new value.
 */
export function lineWidth(value: number): Command {
  return field('lineWidth', value);
}

/**
 * Sets the miter limit ration in space units.
 */
export function miterLimit(value: number): Command {
  return field('miterLimit', value);
}

/**
 * Specifies the level of the blurring effect; this value doesn't correspond to
 * a number of pixels and is not affected by the current transformation matrix.
 */
export function shadowBlur(value: number): Command {
  return field('shadowBlur', value);
}

/**
 * Specifies the color of the shadow.
 */
export function shadowColor(color: string): Command {
  return field('shadowColor', color);
}

/**
 * Specifies the distance that the shadow will be offset in horizontal
 * distance
 */
export function shadowOffsetX(value: number): Command {
  return field('shadowOffsetX', value);
}

/**
 * Specifies the distance that the shadow will be offset in vertical
 * distance
 */
export function shadowOffsetY(value: number): Command {
  return field('shadowOffsetY', value);
}

/**
 * Specifies the color or style to use for the lines around shapes. The default
 * is black
 */
export function strokeStyle(color: string): Command {
  return field('strokeStyle', color);
}

/**
 * Specifies the current text alignment being used when drawing text. Beware
 * that the alignment is based on the x value of the `fillText` command. So if
 * `textAlign` is `Center`, then the text would be drawn at `x - (width / 2)`.
 */
export function textAlign(align: CanvasTextAlign): Command {
  return field('textAlign', align);
}

/**
 * specifies the current text baseline used when drawing text.
 */
export function textBaseline(align: CanvasTextBaseline): Command {
  return field('textBaseline', align);
}

/**
 * Adds an arc to the path which is centered at `x`, `y` position with
 * `radius` starting at `startAngle` and ending at `endAngle` going in the given
 * direction by `anticlockwise`
 */
export function arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): Command {
  return fn('arc', x, y, radius, startAngle, endAngle, anticlockwise == null ? false : anticlockwise);
}

/**
 * Adds an arc to the path with the given control points and radius.
 */
export function arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): Command {
  return fn('arcTo', x1, y1, x2, y2, radius);
}

/**
 * Starts a new path by emptying the list of sub-paths. Call this method when
 * you want to create a new path.
 */
export function beginPath(): Command {
  return fn('beginPath');
}

/**
 * Adds a cubic Bézier curve to the path. It requires three points. The first
 * two points are control points and the third one is the end point. The starting
 * point is the last point in the current path, which can be changed using `moveTo`
 * before creating the Bézier curve.
 */
export function bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): Command {
  return fn('bezierCurveTo', cp1x, cp1y, cp2x, cp2y, x, y);
}

/**
 * Sets all pixels in the rectangle defined by starting point `x`, `y` and
 * size `width`, `height` to transparent black, erasing any previously drawn
 * content
 */
export function clearRect(x: number, y: number, w: number, h: number): Command {
  return fn('clearRect', x, y, w, h);
}

/**
 * Turns the path currently being built into the current clipping path.
 */
export function clip(fillRule?: CanvasFillRule): Command {
  return fillRule == null ? fn('clip') : fn('clip', fillRule);
}

/**
 * Causes the point of the pen to move back to the start of the current
 * sub-path. It tries to add a straight line (but does not actually draw it) from
 * the current point to the start. If the shape has already been closed or has
 * only one point, this function does nothing.
 */
export function closePath(): Command {
  return fn('closePath');
}

/**
 * Fills the current or given path with the current fill style using the
 * non-zero or even-odd winding rule.
 */
export function fill(fillRule?: CanvasFillRule): Command {
  return fillRule == null ? fn('fill') : fn('fill', fillRule);
}

/**
 * This is a helper non-standard method to trace a circle path. Normally, you'd
 * need to call `arc` with the correct arguments. This is a convenience function to
 * easily fill a circle that mirrors `rect`.
 */
export function circle(x: number, y: number, r: number): Command {
  return arc(x, y, r, 0, 2 * Math.PI, false);
}

/**
 * Draws a filled rectangle whose starting point is at the coordinates (`x`, `y`)
 * with the specified `width` and `height` and whose style is determined by the
 * fillStyle attribute.
 */
export function fillRect(x: number, y: number, w: number, h: number): Command {
  return fn('fillRect', x, y, w, h);
}

/**
 * Draws a text string at the specified coordinates, filling the string's
 * characters with the current foreground color.
 */
export function fillText(text: string, x: number, y: number, maxWidth?: number): Command {
  return maxWidth == null ? fn('fillText', text, x, y) : fn('fillText', text, x, y, maxWidth);
}

/**
 * Connects the last point in the sub-path to the x, y coordinates with a
 * straight line (but does not actually draw it)
 */
export function lineTo(x: number, y: number): Command {
  return fn('lineTo', x, y);
}

/**
 * Moves the starting point of a new sub-path to the (x, y) coordinates.
 */
export function moveTo(x: number, y: number): Command {
  return fn('moveTo', x, y);
}

/**
 * Adds a quadratic Bézier curve to the path. It requires two points. The
 * first point is a control point and the second one is the end point. The
 * starting point is the last point in the current path, which can be changed
 * using `moveTo` before creating the quadratic Bézier curve.
 */
export function quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): Command {
  return fn('quadraticCurveTo', cpx, cpy, x, y);
}

/**
 * Creates a path for a rectangle at position (`x`, `y`) with a size that is
 * determined by `width` and `height`. Those four points are connected by straight
 * lines and the sub-path is marked as closed, so that you can `fill` or `stroke`
 */
export function rect(x: number, y: number, w: number, h: number): Command {
  return fn('rect', x, y, w, h);
}

/**
 * Restores the most recently saved canvas state by popping the top entry in
 * the drawing state stack. If there is no saved state, this method does nothing.
 */
export function restore(): Command {
  return fn('restore');
}

/**
 * Saves the entire state of the canvas by pushing the current state onto
 * a stack.
 */
export function save(): Command {
  return fn('save');
}

/**
 * Adds a rotation to the transformation matrix. The `angle` argument
 * represents a clockwise rotation angle and is expressed in radians.
 */
export function rotate(angle: number): Command {
  return fn('rotate', angle);
}

/**
 * Adds a scaling transformation to the canvas units by x horizontally and by
 * y vertically.
 */
export function scale(x: number, y: number): Command {
  return fn('scale', x, y);
}

/**
 * Sets the line dash pattern used when stroking lines, using an array of
 * values which specify alternating lengths of lines and gaps which describe the
 * pattern.
 */
export function setLineDash(segments: number[]): Command {
  return fn('setLineDash', segments);
}

/**
 * Resets (overrides) the current transformation to the identity matrix and
 * then invokes a transformation described by the arguments of this method.
 */
export function setTransform(a: number, b: number, c: number, d: number, e: number, f: number): Command {
  return fn('setTransform', a, b, c, d, e, f);
}

/**
 * Strokes the current or given path with the current stroke style using the
 * non-zero winding rule.
 */
export function stroke(): Command {
  return fn('stroke');
}

/**
 * Paints a rectangle which has a starting point at (`x`, `y`) and has a `width`
 * and an `height` onto the canvas, using the current stroke style.
 */
export function strokeRect(x: number, y: number, w: number, h: number): Command {
  return fn('strokeRect', x, y, w, h);
}

/**
 * Strokes — that is, draws the outlines of — the characters of a specified
 * text string at the given (`x`, `y`) position. If the optional fourth parameter
 * for a maximum width is provided, the text is scaled to fit that width.
 */
export function strokeText(text: string, x: number, y: number, maxWidth?: number): Command {
  return maxWidth == null ? fn('strokeText', text, x, y) : fn('strokeText', text, x, y, maxWidth);
}

/**
 * Multiplies the current transformation with the matrix described by the
 * arguments of this method. You are able to scale, rotate, move and skew the
 * context.
 */
export function transform(a: number, b: number, c: number, d: number, e: number, f: number): Command {
  return fn('transform', a, b, c, d, e, f);
}

/**
 * drawImage
 */
export function drawImage(image: CanvasImageSource, dx: number, dy: number): Command;
export function drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): Command;
export function drawImage(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): Command;
export function drawImage(...args: any[]): Command {
  return command(CommandType.FUNCTION, 'drawImage', args);
}

/**
 * Adds a translation transformation by moving the canvas and its origin `x`
 * horizontally and `y` vertically on the grid.
 */
export function translate(x: number, y: number): Command {
  return fn('translate', x, y);
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

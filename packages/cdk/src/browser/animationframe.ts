import {withAccumArray, EventQueueInstance, Loop} from '@genjer/genjer';

export const enum AnimationSubType {
  TIME,
  DELTA,
}

export class AnimationSub<A> {
  constructor(public tag: AnimationSubType, public fn: (_: number) => A) {
  }

  map<B>(fn: (_: A) => B): AnimationSub<B> {
    return new AnimationSub(this.tag, (n: number) => fn(this.fn(n)));
  }
}

/**
 * An animation frame triggers about 60 times per second. Get the POSIX time
 * on each frame.
 * @param fn
 */
export function onAnimationFrame<A>(fn: (unix: number) => A): AnimationSub<A> {
  return new AnimationSub(AnimationSubType.TIME, fn);
}

/**
 * Just like `onAnimationFrame`, except message is the time in milliseconds
 * since the previous frame. So you should get a sequence of values all around
 * `1000 / 60` which is nice for stepping animations by a time delta.
 * @param fn
 */
export function onAnimationFrameDelta<A>(fn: (delta: number) => A): AnimationSub<A> {
  return new AnimationSub(AnimationSubType.DELTA, fn);
}

/**
 * The interpreter for `AnimationSub` command
 */
export function createAnimationFrameInterpreter(): <A>(queue: EventQueueInstance<A>) => Loop<AnimationSub<A>> {
  function subs<A>(queue: EventQueueInstance<A>) {
    let model: AnimationSub<A>[] = [];
    let idAnimation: any;
    let oldTime = 0;

    function tick() {
      let sub: AnimationSub<A>;
      const current = Date.now();

      for (let i = 0, len = model.length; i < len; i++) {
        sub = model[i];
        if (sub.tag === AnimationSubType.DELTA) {
          queue.push(sub.fn(current - oldTime));
        } else {
          queue.push(sub.fn(current));
        }
      }
      oldTime = current;
      idAnimation = null;

      if (model.length > 0) queue.run();
    }

    return function commit(xs: AnimationSub<A>[]) {
      model = xs;
      if (idAnimation == null && xs.length === 0) {
        oldTime = 0;
        return;
      } else if (idAnimation != null && xs.length === 0) {
        cancelAnimationFrame(idAnimation);
      } else if (idAnimation == null) {
        idAnimation = requestAnimationFrame(tick);
      }
    }
  }

  return withAccumArray(subs);
}

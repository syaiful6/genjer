import {Children} from 'mithril';
import baseRender from 'mithril/render';

import {Dispatch} from '@genjer/genjer';
import {resolveCurrentSignal} from './signal';

export type View<S, A> = (emit: Dispatch<A>, state: S) => Children

export function createRender<S, A>(view: View<S, A>, element: Element): (emit: Dispatch<A>, state: S) => void {
  return (emit, state) => {
    const signal = resolveCurrentSignal();
    (baseRender as any)(element, view(emit, state), signal.emit);
  };
}

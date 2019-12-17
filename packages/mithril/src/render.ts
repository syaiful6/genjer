import {Children} from 'mithril';
import baseRender from 'mithril/render';

import {Dispatch} from '@genjer/genjer';

export type View<S, A> = (emit: Dispatch<A>, state: S) => Children

export function createRender<S, A>(view: View<S, A>, element: Element): (emit: Dispatch<A>, state: S) => void {
  return (emit, state) => {
    (baseRender as any)(element, view(emit, state));
  };
}

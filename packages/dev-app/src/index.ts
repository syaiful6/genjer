import {Vnode} from 'mithril';

import {Dispatch, Transition, Batch, transition, purely, make, mergeInterpreter} from '@genjer/genjer';
import {makeBrowserHistoryInterpreters, liftHistory, HistoryEff, HistorySub, onHistoryChange} from '@genjer/navi';
import {createHistoryListener} from '@genjer/navi/router';
import {createRender, h} from '@genjer/mithril';
import {Page, routeMatcher} from './router';

type Action
  = {tag: 'navigate'; page: Page}
  | {tag: 'navigateTo'; path: string}
  | {tag: 'none'};

type User = {
  id: string;
  name: string;
}

type State = {
  page: Page; // current page
  users: User[];
}

function pushHistory(path: string): HistoryEff<Action> {
  return liftHistory({type: 'push', pathname: path}, {tag: 'none'}) as any;
}

function navigateRoute(page: Page): Action {
  return {tag: 'navigate', page};
}

function update(state: State, action: Action): Transition<HistoryEff<Action>, State, Action> {
  switch (action.tag) {
  case 'navigate':
    return purely({...state, page: action.page});
  case 'navigateTo':
    return transition(state, [pushHistory(action.path)]);
  case 'none':
    return purely(state);
  }
}

function view(dispatch: Dispatch<Action>, state: State): Vnode {
  const page = state.page;
  return h('div', [
    viewNavigation(dispatch),
    h('pre', JSON.stringify(page))
  ]);
}

function viewNavigation(dispatch: Dispatch<Action>): Vnode {
  const links = [['/', 'home'], ['/users', 'users']];
  return h('ul', links.map(text =>
    h('li', {
      key: text[0],
      onclick: (e: Event) => {
        e.preventDefault();
        dispatch({tag: 'navigateTo', path: text[0] })
      }
    }, text[1]))
  )
}

const routeChangeListener = createHistoryListener(routeMatcher, navigateRoute);

function subs(): Batch<HistorySub<Action>, Action> {
  return [
    onHistoryChange(routeChangeListener)
  ];
}

function main() {
  const [history, historyInterpreters] = makeBrowserHistoryInterpreters();
  const interpreter = mergeInterpreter(historyInterpreters[0], historyInterpreters[1]);
  const initialState: State = {
    page: routeMatcher(history.location.pathname),
    users: []
  }
  const render = createRender(view, document.querySelector('.app') as Element);
  const appInstance = make(
    interpreter,
    {render, update, subs, init: purely(initialState)},
  );
  appInstance.run()
}
requestAnimationFrame(main);

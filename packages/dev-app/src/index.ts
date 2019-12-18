import {Children} from 'mithril';

import {Dispatch, Transition, Batch, transition, purely, make, mergeInterpreter} from '@genjer/genjer';
import {makeHashHistoryInterpreters, liftHistory, HistoryEff, HistorySub, onHistoryChange} from '@genjer/navi';
import {createHistoryListener} from '@genjer/navi/router';
import {createRender, h} from '@genjer/mithril';
import {Page, routeMatcher} from './router';

type Action
  = {tag: 'routeChange'; page: Page}
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
  return {tag: 'routeChange', page};
}

function update(state: State, action: Action): Transition<HistoryEff<Action>, State, Action> {
  switch (action.tag) {
  case 'routeChange':
    return purely({...state, page: action.page});
  case 'navigateTo':
    return transition(state, [pushHistory(action.path)]);
  case 'none':
    return purely(state);
  }
}

function view(dispatch: Dispatch<Action>, state: State): Children {
  const page = state.page;
  return h('div', [
    viewNavigation(dispatch),
    h('pre', JSON.stringify(page))
  ]);
}

function viewNavigation(dispatch: Dispatch<Action>): Children {
  const links = [['/', 'Home'], ['/users', 'Users'], ['/about', 'About']];
  return h('ul', links.map(text =>
    h('li', {
      key: text[0],
      href: '#',
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
  const [history, historyInterpreters] = makeHashHistoryInterpreters();
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

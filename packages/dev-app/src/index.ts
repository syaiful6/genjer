import {Dispatch, Transition, Batch, transition, purely, make, mergeInterpreter} from '@genjer/genjer';
import {makeHashHistoryInterpreters, liftHistory, HistoryEff, HistorySub, onHistoryChange} from '@genjer/navi';
import {createHistoryListener} from '@genjer/navi/router';
import {VNode} from 'snabbdom/vnode';
import {h} from 'snabbdom/h';
import ListenerModule from 'snabbdom/modules/eventlisteners';
import AttrModule from 'snabbdom/modules/attributes';
import ClassModule from 'snabbdom/modules/class';
import PropModule from 'snabbdom/modules/props';
import StyleModule from 'snabbdom/modules/style';
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

function render(dispatch: Dispatch<Action>, state: State): VNode {
  const page = state.page;
  return h('div', [
    renderNavigation(dispatch),
    h('pre', JSON.stringify(page))
  ]);
}

function renderNavigation(dispatch: Dispatch<Action>): VNode {
  const links = [['/', 'home'], ['/users', 'users']];
  return h('ul', links.map(text =>
    h('li', {
      key: text[0],
      on: {
        click: (e: Event) => {
          e.preventDefault();
          dispatch({tag: 'navigateTo', path: text[0] })
        }
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
  const history = makeHashHistoryInterpreters();
  const interpreter = mergeInterpreter(history[0], history[1]);
  const initialState: State = {
    page: {id: 'home', params: {}},
    users: []
  }
  const appInstance = make(
    interpreter as any,
    {render, update, subs, init: purely(initialState)},
    document.querySelector('.app') as Element,
    {modules: [AttrModule, PropModule, ClassModule, StyleModule, ListenerModule]}
  );
  appInstance.run()
}
requestAnimationFrame(main);

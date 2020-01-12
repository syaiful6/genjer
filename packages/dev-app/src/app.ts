import {Children} from 'mithril';

import {Dispatch, Transition, Batch, purely, transition} from '@genjer/genjer';
import {HistoryEff, HistorySub, liftHistory, onHistoryChange} from '@genjer/navi';
import {createHistoryListener} from '@genjer/navi/router';
import {h} from '@genjer/mithril';

import {Page, routeMatcher} from './router';


export type Action
  = {tag: 'routeChange'; page: Page}
  | {tag: 'navigateTo'; path: string}
  | {tag: 'none'}

export type User = {
  id: string;
  name: string;
}

export type State = {
  page: Page; // current page
  users: User[];
}

function pushHistory(path: string): HistoryEff<Action> {
  return liftHistory({type: 'push', pathname: path}, {tag: 'none'}) as any;
}

function navigateRoute(page: Page): Action {
  return {tag: 'routeChange', page};
}

export function update(state: State, action: Action): Transition<HistoryEff<Action>, State, Action> {
  switch (action.tag) {
  case 'routeChange':
    return purely({...state, page: action.page});
  case 'navigateTo':
    return transition(state, [pushHistory(action.path)]);
  case 'none':
    return purely(state);
  }
}

export function view(dispatch: Dispatch<Action>, state: State): Children {
  const page = state.page;
  return h('div', [
    viewNavigation(dispatch),
    pageView(page),
  ]);
}

function pageView(current: Page): Children {
  switch (current.id) {
  case 'about':
    return h('h1', 'About');
  case 'home':
    return h('h1', 'Home');
  case 'users':
    return h('h1', 'User List');
  case 'profile':
    return h('h1', `user profile ${current.params.id}`);
  case 'notfound':
    return h('h1', 'Not found');
  default:
    return h('h1', 'invalid state');
  }
}

function viewNavigation(dispatch: Dispatch<Action>): Children {
  const links = [['/', 'Home'], ['/users', 'Users'], ['/about', 'About'], ['/users/1', 'User 1']];
  return h('ul', links.map(text =>
      h('li', {key: text[0]},
        h('a', {
          href: '#',
          onclick: (e: Event) => {
            e.preventDefault();
            dispatch({tag: 'navigateTo', path: text[0]})
          }
        }, text[1])
      )
    )
  );
}

const routeChangeListener = createHistoryListener(routeMatcher, navigateRoute);

export function subs(): Batch<HistorySub<Action>, Action> {
  return [
    onHistoryChange(routeChangeListener)
  ];
}

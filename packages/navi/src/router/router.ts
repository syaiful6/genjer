import {HistoryChangeListener} from '@genjer/navi'

import {compileTemplate, Matcher} from './parsing';

export type RouteMap<A> = {
  [template: string]: (params: any) => A;
}

type Route<A> = {
  check: Matcher;
  transform: (params: any) => A;
}

export interface RouteMatcher<A> {
  (path: string): A;
}

/**
 * Create location listener the returned function can be used as argument of
 * `onHistoryChange` subscription, and it will notify your App `update/reducer`
 * when the history changed
 */
export function createHistoryListener<Page, Action>(
  router: RouteMatcher<Page>,
  mapper: (_: Page) => Action
): HistoryChangeListener<Action> {
  return (location) => mapper(router(location.pathname))
}

/**
 * Lower level, if you need to handle the routing system notification yourself.
 * @type {A}
 */
export function createRouteMatcher<A>(defaultRoute: A, routes: RouteMap<A>): RouteMatcher<A> {
  let compiled: Route<A>[] = Object.keys(routes).map(key => {
    return {
      check: compileTemplate(key),
      transform: routes[key],
    };
  });
  return (path) => {
    let match: [boolean, any];
    for (let i = 0, len = compiled.length; i < len; i++) {
      match = compiled[i].check(path);
      if (match[0]) {
        return compiled[i].transform(match[1]);
      }
    }
    // nothing to match
    return defaultRoute;
  };
}

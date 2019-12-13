import {createRouteMatcher} from '@genjer/navi/router'

export type BasePage<ID extends string, Payload = any> = {
  id: ID;
  params: Payload;
}

export type Page
  = BasePage<'home'>
  | BasePage<'users'>
  | BasePage<'profile', {id: string}>
  | BasePage<'notfound'>

export const routeMatcher = createRouteMatcher<Page>({id: 'notfound', params: {}}, {
  '/': () => ({ id: 'home', params: {}}),
  '/users': () => ({ id: 'users', params: {}}),
  '/users/:id': (params: {id: string}) => ({ id: 'users', params }),
});

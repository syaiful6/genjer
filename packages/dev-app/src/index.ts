import {purely, make, mergeInterpreter} from '@genjer/genjer';
import {makeHashHistoryInterpreters} from '@genjer/navi';
import {createRender} from '@genjer/mithril';

import {State, view, update, subs} from './app';
import {routeMatcher} from './router';

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

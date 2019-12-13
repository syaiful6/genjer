import {stepper, EventQueueInstance, Loop} from '@genjer/genjer';
import {
  History,
  BrowserHistoryBuildOptions, createBrowserHistory,
  HashHistoryBuildOptions, createHashHistory,
  MemoryHistoryBuildOptions, createMemoryHistory
} from 'history';

import {makeHistoryNat, HistoryEff} from './history-eff';
import {makeHistorySubInterpreter, HistorySub} from './history-subs';

export type HistoryInterpreterPair = [
  <A>(o: EventQueueInstance<A>) => Loop<HistoryEff<A>>,
  <A>(o: EventQueueInstance<A>) => Loop<HistorySub<A>>,
]

/**
 * Create a pair of history interpreter that connected to the same history:
 * - the first item is interpreter for effects
 * - the second item is interpreter for subs
 * @param history
 */
export function makeHistoryInterpreters(history: History): [History, HistoryInterpreterPair] {
  const eff = stepper(makeHistoryNat(history));
  const subs = makeHistorySubInterpreter(history);

  return [history, [eff, subs]];
}

/**
 * Same as `makeHistoryInterpreters` but use browser history as History implementation
 */
export function makeBrowserHistoryInterpreters(opts?: BrowserHistoryBuildOptions): [History, HistoryInterpreterPair] {
  return makeHistoryInterpreters(createBrowserHistory(opts));
}

/**
 * Same as `makeHistoryInterpreters` but use hash history as History implementation
 */
export function makeHashHistoryInterpreters(opts?: HashHistoryBuildOptions): [History, HistoryInterpreterPair] {
  return makeHistoryInterpreters(createHashHistory(opts));
}

/**
 * Same as `makeHistoryInterpreters` but use memory history as History implementation
 */
export function makeMemoryHistoryInterpreters(opts?: MemoryHistoryBuildOptions): [History, HistoryInterpreterPair] {
  return makeHistoryInterpreters(createMemoryHistory(opts));
}

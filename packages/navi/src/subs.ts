import {stepper, EventQueueInstance, Loop} from '@genjer/genjer';
import {History} from 'history';

import {makeHistoryNat, HistoryEff} from './history-eff';
import {makeHistorySubInterpreter, HistorySub} from './history-subs';

export type HistoryInterpreterPair = [
  <A>(o: EventQueueInstance<A>) => Loop<HistoryEff<A>>,
  <A>(o: EventQueueInstance<A>) => Loop<HistorySub<A>>,
]

/**
 * Create a pair of history interpreter:
 * - the first item is interpreter for effects
 * - the second item is interpreter for subs
 * @param history
 */
export function makeHistoryInterpreterPair(history: History): HistoryInterpreterPair {
  const eff = stepper(makeHistoryNat(history));
  const subs = makeHistorySubInterpreter(history);

  return [eff, subs];
}

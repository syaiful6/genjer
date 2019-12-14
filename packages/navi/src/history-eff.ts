import {scheduleSyncCallback} from '@genjer/genjer';
import {History} from 'history';
import {HistoryAction} from './types';

export class HistoryEff<A> {
  constructor(readonly cmd: HistoryAction, readonly val: A) {
  }

  map<B>(f: (_: A) => B): HistoryEff<B> {
    return new HistoryEff(this.cmd, f(this.val));
  }
}

export function liftHistory(cmd: HistoryAction): HistoryEff<void>;
export function liftHistory<A>(cmd: HistoryAction, value: A): HistoryEff<A>;
export function liftHistory(cmd: HistoryAction, value?: any) {
  return new HistoryEff(cmd, value);
}

/**
 * Interpret HistoryEff into History call. The resulting function will be effectful
 * in sense it might modify browser history.
 * @param history
 */
export function makeHistoryNat(history: History) {
  return function historyNat<A>(eff: HistoryEff<A>): A {
    switch (eff.cmd.type) {
    case 'push':
      history.push({...eff.cmd});
      break;

    case 'replace':
      history.replace(eff.cmd.pathname, eff.cmd.state);
      break;

    case 'go':
      history.go(eff.cmd.amount);
      break;

    case 'goback':
      history.goBack();
      break;

    case 'forward':
      history.goForward();
      break;
    }

    return eff.val;
  }
}

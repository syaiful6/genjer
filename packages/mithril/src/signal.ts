import {currentSignal, Signal} from '@genjer/genjer';

export function resolveCurrentSignal(): Signal {
  let sign = currentSignal.current;
  if (sign === null) {
    throw new Error('useXXX hook can only called in render function');
  }
  return sign;
}

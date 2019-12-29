/**
 * Passive event
 */

// Cached result of whether the user's browser supoorts passive event listener
let supportsPassiveEvents: boolean;

/**
 * Checks whether the user's browser supports passive event listeners.
 */
export function isSupportsPassiveEvents(): boolean {
  if (supportsPassiveEvents == null && typeof window !== 'undefined') {
    try {
      window.addEventListener('test', null!, Object.defineProperty({}, 'passive', {
        get: () => supportsPassiveEvents = true
      }));
    } finally {
      supportsPassiveEvents = supportsPassiveEvents || false;
    }
  }

  return supportsPassiveEvents;
}

/**
 * Normalizes an `AddEventListener` object to something that can be passed
 * to `addEventListener` on any browser, no matter whether it supports the
 * options` parameter.
 * @param options
 */
export function normalizePassiveListenerOptions(options: AddEventListenerOptions): AddEventListenerOptions | boolean {
  return isSupportsPassiveEvents() ? options : !!options.capture;
}

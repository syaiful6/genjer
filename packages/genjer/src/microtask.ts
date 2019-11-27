let queue: (() => void)[] = [];
let length = 0;

let onMicroTask: () => void;

// typescript need this
declare var importScripts: any;

// mutation observer
const browserWindow = (typeof window !== 'undefined') ? window : undefined;
const browserGlobal: any = browserWindow || {};
const BrowserMutationObserver: any = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;

if (typeof queueMicrotask === 'function') {
  onMicroTask = () => {
    queueMicrotask(drain);
  };
} else if (typeof Promise !== 'undefined') {
  onMicroTask = () => {
    Promise.resolve()
      .then(() => drain())
      .catch(e => setTimeout(() => { throw e}));
  }
} else if (BrowserMutationObserver && (browserGlobal.navigator &&
  (browserGlobal.navigator.standalone || browserGlobal.cordova))) {
    onMicroTask = (function () {
      // Using 2 mutation observers to batch multiple updates into one.
    let div = document.createElement('div');
    let opts = { attributes: true };
    let toggleScheduled = false;
    let div2 = document.createElement('div');
    let o2 = new BrowserMutationObserver(() => {
      div.classList.toggle('foo');
      toggleScheduled = false;
    });
    o2.observe(div2, opts);

    function scheduleToggle() {
      if (toggleScheduled) return;
      toggleScheduled = true;
      div2.classList.toggle('foo');
    }

    return () => {
      let o = new BrowserMutationObserver(() => {
        o.disconnect();
        drain();
      });
      o.observe(div, opts);
      scheduleToggle();
    }
    })();
} else if (typeof self === 'undefined' &&
  typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
    onMicroTask = () => { process.nextTick(drain); };
} else if ( typeof Uint8ClampedArray !== 'undefined' &&
  typeof importScripts !== 'undefined' &&
  typeof MessageChannel !== 'undefined') {

    onMicroTask = (function() {
      let channel = new MessageChannel();
      channel.port1.onmessage = () => drain();
      return () => channel.port2.postMessage(0);
    })();
} else {
  onMicroTask = () => setTimeout(drain)
}

function drain() {
  let q = queue, l = length;

  queue = [];
  length = 0;
  for (let i = 0; i < l; i++) {
    q[i](); // don't care if it error
  }
}

export function microTask(cb: () => void) {
  if (!length) onMicroTask();
  queue[length++] = cb;
}

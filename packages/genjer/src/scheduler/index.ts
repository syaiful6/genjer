import {push, pop, peek, Item, Heap} from './heap';
import {
  requestHostCallback,
  requestHostTimeout,
  cancelHostTimeout,
  shouldYieldToHost,
  getCurrentTime,
} from './executors';

export const enum PriorityLevel {
  NoPriority,
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
}

export type TaskCallback = (_: boolean) => TaskCallback | void;

export type TaskOptions = {
  timeout: number;
  delay: number;
}

export type Task = Item & {
  callback: null | TaskCallback;
  priorityLevel: PriorityLevel;
  startTime: number;
  expirationTime: number;
}

// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
let maxSigned31BitInt = 1073741823;

// Times out immediately
let IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out
let USER_BLOCKING_PRIORITY = 250;
let NORMAL_PRIORITY_TIMEOUT = 5000;
let LOW_PRIORITY_TIMEOUT = 10000;
// Never times out
let IDLE_PRIORITY = maxSigned31BitInt;

// Tasks are stored on a min heap
let taskQueue: Heap<Task> = [];
let timerQueue: Heap<Task> = [];

// Incrementing id counter. Used to maintain insertion order.
let taskIdCounter = 1;

// Pausing the scheduler is useful for debugging.
let isSchedulerPaused = false;

let currentTask: Task | null = null;
let currentPriorityLevel = PriorityLevel.NormalPriority;

// This is set while performing work, to prevent re-entrancy.
let isPerformingWork = false;

let isHostCallbackScheduled = false;
let isHostTimeoutScheduled = false;

function advanceTimers(currentTime: number) {
  // Check for tasks that are no longer delayed and add them to the queue.
  let timer: Task | null = peek(timerQueue);
  while (timer !== null) {
    if (timer.callback === null) {
      // Timer was cancelled.
      pop(timerQueue);
    } else if (timer.startTime <= currentTime) {
      // Timer fired. Transfer to the task queue.
      pop(timerQueue);
      timer.sortIndex = timer.expirationTime;
      push(taskQueue, timer);
    } else {
      // Remaining timers are pending.
      return;
    }
    timer = peek(timerQueue);
  }
}

function handleTimeout(currentTime: number) {
  isHostTimeoutScheduled = false;
  advanceTimers(currentTime);

  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    } else {
      const firstTimer: Task | null = peek(timerQueue);
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}

function flushWork(hasTimeRemaining: boolean, initialTime: number) {
  // We'll need a host callback the next time work is scheduled.
  isHostCallbackScheduled = false;
  if (isHostTimeoutScheduled) {
    // We scheduled a timeout but it's no longer needed. Cancel it.
    isHostTimeoutScheduled = false;
    cancelHostTimeout();
  }

  isPerformingWork = true;
  const previousPriorityLevel = currentPriorityLevel;
  try {
    return workLoop(hasTimeRemaining, initialTime);
  } finally {
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
  }
}

function workLoop(hasTimeRemaining: boolean, initialTime: number) {
  let currentTime = initialTime;
  advanceTimers(currentTime);
  currentTask = peek(taskQueue);
  while (
    currentTask !== null && !isSchedulerPaused
  ) {
    if (
      currentTask.expirationTime > currentTime &&
      (!hasTimeRemaining || shouldYieldToHost())
    ) {
      // This currentTask hasn't expired, and we've reached the deadline.
      break;
    }
    const callback = currentTask.callback;
    if (callback !== null) {
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime();
      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback;
      } else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
      }
      advanceTimers(currentTime);
    } else {
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }
  // Return whether there's additional work
  if (currentTask !== null) {
    return true;
  } else {
    let firstTimer: Task | null = peek(timerQueue);
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    return false;
  }
}

export function runWithPriority<A = any>(priorityLevel: PriorityLevel, eventHandler: () => A): A {
  switch (priorityLevel) {
    case PriorityLevel.ImmediatePriority:
    case PriorityLevel.UserBlockingPriority:
    case PriorityLevel.NormalPriority:
    case PriorityLevel.LowPriority:
    case PriorityLevel.IdlePriority:
      break;
    default:
      priorityLevel = PriorityLevel.NormalPriority;
  }

  let previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;
  try {
    return eventHandler();
  } finally {
    currentPriorityLevel = previousPriorityLevel;
  }
}

export function next<A = any>(eventHandler: () => A): A {
  let priorityLevel: PriorityLevel;
  switch (currentPriorityLevel) {
    case PriorityLevel.ImmediatePriority:
    case PriorityLevel.UserBlockingPriority:
    case PriorityLevel.NormalPriority:
      // Shift down to normal priority
      priorityLevel = PriorityLevel.NormalPriority;
      break;
    default:
      // Anything lower than normal priority should remain at the current level.
      priorityLevel = currentPriorityLevel;
      break;
  }

  let previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;

  try {
    return eventHandler();
  } finally {
    currentPriorityLevel = previousPriorityLevel;
  }
}

export function wrapCallback<A>(callback: (this: any, ...args: any[]) => A): (this: any, ...args: any[]) => A {
  var parentPriorityLevel = currentPriorityLevel;
  return function(...args: any[]) {
    // This is a fork of runWithPriority, inlined for performance.
    var previousPriorityLevel = currentPriorityLevel;
    currentPriorityLevel = parentPriorityLevel;

    try {
      return callback.apply(this, args);
    } finally {
      currentPriorityLevel = previousPriorityLevel;
    }
  };
}

function timeoutForPriorityLevel(priorityLevel: PriorityLevel): number {
  switch (priorityLevel) {
    case PriorityLevel.ImmediatePriority:
      return IMMEDIATE_PRIORITY_TIMEOUT;
    case PriorityLevel.UserBlockingPriority:
      return USER_BLOCKING_PRIORITY;
    case PriorityLevel.IdlePriority:
      return IDLE_PRIORITY;
    case PriorityLevel.LowPriority:
      return LOW_PRIORITY_TIMEOUT;
    case PriorityLevel.NormalPriority:
    default:
      return NORMAL_PRIORITY_TIMEOUT;
  }
}

export function scheduleCallback(priorityLevel: PriorityLevel, callback: TaskCallback, options?: Partial<TaskOptions>): Task {
  let currentTime = getCurrentTime();

  let startTime;
  let timeout;
  if (typeof options === 'object' && options !== null) {
    let delay = options.delay;
    if (typeof delay === 'number' && delay > 0) {
      startTime = currentTime + delay;
    } else {
      startTime = currentTime;
    }
    timeout =
      typeof options.timeout === 'number'
        ? options.timeout
        : timeoutForPriorityLevel(priorityLevel);
  } else {
    timeout = timeoutForPriorityLevel(priorityLevel);
    startTime = currentTime;
  }

  let expirationTime = startTime + timeout;

  let newTask: Task = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };

  if (startTime > currentTime) {
    // This is a delayed task.
    newTask.sortIndex = startTime;
    push(timerQueue, newTask);
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      // All tasks are delayed, and this is the task with the earliest delay.
      if (isHostTimeoutScheduled) {
        // Cancel an existing timeout.
        cancelHostTimeout();
      } else {
        isHostTimeoutScheduled = true;
      }
      // Schedule a timeout.
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);
    // Schedule a host callback, if needed. If we're already performing work,
    // wait until the next time we yield.
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    }
  }

  return newTask;
}

export function getCurrentPriorityLevel(): PriorityLevel {
  return currentPriorityLevel;
}

export function pauseExecution() {
  isSchedulerPaused = true;
}

export function continueExecution() {
  isSchedulerPaused = false;
  if (!isHostCallbackScheduled && !isPerformingWork) {
    isHostCallbackScheduled = true;
    requestHostCallback(flushWork);
  }
}

export function getFirstCallbackNode(): Task | null {
  return peek(taskQueue);
}

export function cancelCallback(task: Task) {
  // Null out the callback to indicate the task has been canceled. (Can't
  // remove from the queue because you can't remove arbitrary nodes from an
  // array based heap, only the first one.)
  task.callback = null;
}

export function shouldYield() {
  const currentTime = getCurrentTime();
  advanceTimers(currentTime);
  const firstTask: Task | null = peek(taskQueue);
  return (
    (firstTask !== currentTask &&
      currentTask !== null &&
      firstTask !== null &&
      firstTask.callback !== null &&
      firstTask.startTime <= currentTime &&
      firstTask.expirationTime < currentTask.expirationTime) ||
    shouldYieldToHost()
  );
}

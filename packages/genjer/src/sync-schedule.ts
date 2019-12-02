import {
  getCurrentTime, scheduleCallback, cancelCallback, runWithPriority,
  TaskCallback, Task, PriorityLevel
} from './scheduler';

let initialTimeMS: number = getCurrentTime();
let syncQueue: TaskCallback[] | null = null;
let immediateQueueCallbackNode: Task | null = null;
let isFlushingSyncQueue: boolean = false;

export const now = initialTimeMS < 10000 ? getCurrentTime : () => getCurrentTime() - initialTimeMS;

export function scheduleSyncCallback(callback: TaskCallback) {
  if (syncQueue === null) {
    syncQueue = [callback];
    immediateQueueCallbackNode = scheduleCallback(PriorityLevel.ImmediatePriority, flushSyncCallbackQueueImpl);
  } else {
    syncQueue.push(callback);
  }
}

export function flushSyncCallbackQueue() {
  if (immediateQueueCallbackNode !== null) {
    const node = immediateQueueCallbackNode;
    immediateQueueCallbackNode = null;
    cancelCallback(node);
  }
  flushSyncCallbackQueueImpl();
}

function flushSyncCallbackQueueImpl() {
  if (!isFlushingSyncQueue && syncQueue !== null) {
    isFlushingSyncQueue = true;
    let i = 0;
    try {
      const isSync = true;
      const queue = syncQueue;
      runWithPriority(PriorityLevel.ImmediatePriority, () => {
        for (; i < queue.length; i++) {
          let callback = queue[i];
          do {
            callback = callback(isSync) as any;
          } while (callback != null);
        }
      });
      syncQueue = null;
    } catch(error) {
      // If something throws, leave the remaining callbacks on the queue.
      if (syncQueue !== null) {
        syncQueue = syncQueue.slice(i + 1);
      }
      // Resume flushing in the next tick
      scheduleCallback(
        PriorityLevel.ImmediatePriority,
        flushSyncCallbackQueue,
      );
      throw error;
    } finally {
      isFlushingSyncQueue = false;
    }
  }
}

import TimeoutError from '../errors/TimeoutError'
import CancelError from "../errors/CancelError";

export const DEFAULT_TIMEOUT = 10000;
const DEFAULT_INTERVAL = 500;

let CancelablePromise = (promise, cancel) => ({
  then: promise.then.bind(promise),
  cancel
});

let polling = (task, interval: number = DEFAULT_INTERVAL, timeout: number = DEFAULT_TIMEOUT) => {
  let timeoutId;
  let currentTask;
  let cancel;

  let startTime = Date.now()
  let endTime = startTime + timeout

  let promise = new Promise((resolve, reject) => {
    cancel = () => {
      timeoutId && clearTimeout(timeoutId);
      currentTask && currentTask.cancel();
      reject(new CancelError());
    };

    let tick = () => {
      currentTask = task();

      currentTask
        .then(result => {
          let nowTime = Date.now()

          if (result) {
            resolve(result);
          } if (nowTime > endTime) {
            // TODO: Pass function name as param
            reject(new TimeoutError('poll timeout'))
          }
          else {
            timeoutId = setTimeout(() => {
              tick();
            }, interval);
          }
        })
        .catch(reject);
    };

    setTimeout(() => tick());
  });

  return CancelablePromise(promise, cancel);
};

export { CancelablePromise, polling as poll };

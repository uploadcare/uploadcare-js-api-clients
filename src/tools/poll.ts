import CancelError from "../errors/CancelError";

export const DEFAULT_TIMEOUT = 10000;
const DEFAULT_INTERVAL = 500;

let CancelablePromise = (promise, cancel) => ({
  then: promise.then.bind(promise),
  cancel
});

let polling = (task, time: number) => {
  let timeoutId;
  let currentTask;
  let cancel;

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
          if (result) {
            resolve(result);
          } else {
            timeoutId = setTimeout(() => {
              tick();
            }, time);
          }
        })
        .catch(reject);
    };

    setTimeout(() => tick());
  });

  return CancelablePromise(promise, cancel);
};

export { CancelablePromise, polling as poll };

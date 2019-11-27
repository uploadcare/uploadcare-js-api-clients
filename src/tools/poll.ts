import CancelError from "../errors/CancelError";

export const DEFAULT_TIMEOUT = 10000;
const DEFAULT_INTERVAL = 500;

let polling = (task, time: number) => {
  let id;
  let currentTask;
  let cancel;

  let promise = new Promise((resolve, reject) => {
    cancel = () => {
      id && clearTimeout(id);
      currentTask && currentTask.cancel();
      reject(new CancelError());
    };

    let tick = () => {
      id = setTimeout(() => {
        currentTask = task();

        currentTask
          .then(result => {
            if (result) {
              resolve(result);
            } else {
              tick();
            }
          })
          .catch(reject);
      }, time);
    };

    tick();
  });

  // @ts-ignore
  promise.cancel = cancel;

  return promise;
};

export default polling;

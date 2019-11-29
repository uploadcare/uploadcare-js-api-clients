import CancelError from "../../src/errors/CancelError";
import TimeoutError from "../../src/errors/TimeoutError";
import CancelController from "../CancelController";

type TestEnd = (cancel: CancelController) => Promise<boolean> | boolean

let pooolling = (
  test: TestEnd,
  {
    timeout = 1000,
    interval = 100,
    cancelController
  }: { timeout?: number; interval?: number; cancelController?: any } = {}
) =>
  new Promise((resolve, reject) => {
    let timeoutId: number;
    let startTime = Date.now();
    let endTime = startTime + timeout;

    if (cancelController) {
      cancelController.onCancel(() => {
        timeoutId && clearTimeout(timeoutId);
        reject(new CancelError());
      });
    }

    let tick = async () => {
      try {
        let result = await test(cancelController);
        let nowTime = Date.now();

        if (result) {
          resolve(result);
        } else if (nowTime > endTime) {
          reject(new TimeoutError("Poll Timeout"));
        } else {
          // @ts-ignore
          timeoutId = setTimeout(() => {
            tick();
          }, interval);
        }
      } catch (error) {
        reject(error);
      }
    };

    timeoutId = setTimeout(() => tick());
  });

export default pooolling

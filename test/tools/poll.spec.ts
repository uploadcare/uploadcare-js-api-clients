import { delay } from "../../src/api/request/delay";
import CancelError from "../../src/errors/CancelError";
import TimeoutError from "../../src/errors/TimeoutError";

let longJob = (attemps, fails = null) => {
  let runs = 1;
  let condition = jasmine.createSpy("condition");
  let cancel = jasmine.createSpy("cancelCondition");

  let isFinish = cancelCrtl =>
    new Promise((resolve, reject) => {
      condition();
      cancelCrtl && cancelCrtl.onCancel(() => cancel());

      if (runs === attemps) {
        fails ? reject(fails) : resolve(true);
      } else {
        runs += 1;
        resolve(false);
      }
    });

  return {
    isFinish,
    spy: {
      condition,
      cancel
    }
  };
};

let CancelController = () => {
  let cb = [];

  return {
    onCancel: fn => {
      // @ts-ignore
      cb.push(fn);
    },
    // @ts-ignore
    cancel: () => cb.forEach(f => f())
  };
};

let pooolling = (
  testFn,
  {
    timeout = 1000,
    interval = 100,
    cancelController
  }: { timeout?: number; interval?: number; cancelController?: any } = {}
) =>
  new Promise((resolve, reject) => {
    let timeoutId;
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
        let result = await testFn(cancelController);
        let nowTime = Date.now();

        if (result) {
          resolve(result);
        } else if (nowTime > endTime) {
          // TODO: Pass function name as param
          reject(new TimeoutError("poll timeout"));
        } else {
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

describe("poll", () => {
  it("should be resolved", async () => {
    let job = longJob(3);
    let result = await pooolling(job.isFinish, { interval: 300 });

    expect(result).toBeTruthy();
    expect(job.spy.condition).toHaveBeenCalledTimes(3);
    expect(job.spy.cancel).not.toHaveBeenCalled();
  });

  it("should be able to cancel polling async", async () => {
    let job = longJob(3);
    let ctrl = CancelController();

    setTimeout(() => {
      ctrl.cancel();
    });

    await expectAsync(
      pooolling(job.isFinish, { interval: 300, cancelController: ctrl })
    ).toBeRejectedWith(new CancelError());

    expect(job.spy.condition).not.toHaveBeenCalled();
    expect(job.spy.cancel).not.toHaveBeenCalled();
  });

  it("should not run any logic after cancel", async () => {
    let job = longJob(10);
    let ctrl = CancelController();

    setTimeout(() => {
      ctrl.cancel();
    });

    await expectAsync(
      pooolling(job.isFinish, { interval: 100, cancelController: ctrl })
    ).toBeRejectedWith(new CancelError());

    expect(job.spy.condition).not.toHaveBeenCalled();
    expect(job.spy.cancel).not.toHaveBeenCalled();

    await delay(200);

    expect(job.spy.condition).not.toHaveBeenCalled();
    expect(job.spy.cancel).not.toHaveBeenCalled();
  });

  it("should be able to cancel polling async after first request", async () => {
    let job = longJob(3);
    let ctrl = CancelController();

    setTimeout(() => {
      ctrl.cancel();
    }, 350);

    await expectAsync(
      pooolling(job.isFinish, { interval: 300, cancelController: ctrl })
    ).toBeRejectedWith(new CancelError());

    expect(job.spy.condition).toHaveBeenCalledTimes(2);
    expect(job.spy.cancel).toHaveBeenCalledTimes(2);
  });

  it("should fails with timeout error", async () => {
    let job = longJob(3);

    await expectAsync(
      pooolling(job.isFinish, { interval: 200, timeout: 100 })
    ).toBeRejectedWith(new TimeoutError("poll timeout"));
  });

  it("should not run any logic after timeout error", async () => {
    let job = longJob(3);

    await expectAsync(
      pooolling(job.isFinish, { interval: 100, timeout: 20 })
    ).toBeRejectedWith(new TimeoutError("poll timeout"));

    expect(job.spy.condition).toHaveBeenCalledTimes(2);

    await delay(300);

    expect(job.spy.condition).toHaveBeenCalledTimes(2);
  });

  it("should handle errors", async () => {
    let error = new Error("test error");
    // @ts-ignore
    let job = longJob(5, error);

    await expectAsync(
      pooolling(job.isFinish, { interval: 100 })
    ).toBeRejectedWith(error);
  });
});

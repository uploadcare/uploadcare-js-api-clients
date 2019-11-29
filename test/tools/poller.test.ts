import poll from '../../src/tools/poller'
import CancelController from '../../src/CancelController'
import { delay } from "../../src/api/request/delay";
import CancelError from "../../src/errors/CancelError";
import TimeoutError from "../../src/errors/TimeoutError";

let longJob = (attemps: number, fails: Error | null = null) => {
  let runs = 1;
  let condition = jasmine.createSpy("condition");
  let cancel = jasmine.createSpy("cancelCondition");

  let isFinish = cancelCrtl => {
    condition();

    if (cancelCrtl) {
      cancelCrtl.onCancel(cancel);
    }

    if (runs === attemps) {
      if (fails) {
        throw fails
      }

      return true;
    } else {
      runs += 1;
      return false;
    }
  }

  return {
    isFinish,
    asyncIsFinish: cancel => new Promise<boolean>((resolve, reject) => {
      try {
        resolve(isFinish(cancel))
      } catch (error) {
        reject(error)
      }
    }),
    spy: {
      condition,
      cancel
    }
  };
};

describe("poll", () => {
  it("should be resolved", async () => {
    let job = longJob(3);
    let result = await poll(job.isFinish, { interval: 20 });

    expect(result).toBeTruthy();
    expect(job.spy.condition).toHaveBeenCalledTimes(3);
    expect(job.spy.cancel).not.toHaveBeenCalled();
  });

  it("should be able to cancel polling async", async () => {
    let job = longJob(3);
    let ctrl = new CancelController();

    ctrl.cancel();

    await expectAsync(
      poll(job.isFinish, { interval: 20, cancelController: ctrl })
    ).toBeRejectedWith(new CancelError());

    expect(job.spy.condition).not.toHaveBeenCalled();
    expect(job.spy.cancel).not.toHaveBeenCalled();
  });

  it("should not run any logic after cancel", async () => {
    let job = longJob(10);
    let ctrl = new CancelController();

    ctrl.cancel();

    await expectAsync(
      poll(job.isFinish, { interval: 20, cancelController: ctrl })
    ).toBeRejectedWith(new CancelError());

    let conditionCallsCount = job.spy.condition.calls.count()
    let cancelCallsCount = job.spy.cancel.calls.count()

    await delay(50);

    expect(job.spy.condition).toHaveBeenCalledTimes(conditionCallsCount);
    expect(job.spy.cancel).toHaveBeenCalledTimes(cancelCallsCount);
  });

  it("should be able to cancel polling async after first request", async () => {
    let job = longJob(10);
    let ctrl = new CancelController();

    setTimeout(() => {
      ctrl.cancel();
    }, 30);

    await expectAsync(
      poll(job.isFinish, { interval: 20, cancelController: ctrl })
    ).toBeRejectedWith(new CancelError());

    expect(job.spy.condition).toHaveBeenCalledTimes(2);
    expect(job.spy.cancel).toHaveBeenCalledTimes(2);
  });

  it("should fails with timeout error", async () => {
    let job = longJob(30);

    await expectAsync(
      poll(job.isFinish, { interval: 40, timeout: 20 })
    ).toBeRejectedWith(new TimeoutError("Poll Timeout"));
  });

  it("should not run any logic after timeout error", async () => {
    let job = longJob(30);

    await expectAsync(
      poll(job.isFinish, { interval: 40, timeout: 20 })
    ).toBeRejectedWith(new TimeoutError("Poll Timeout"));

    let conditionCallsCount = job.spy.condition.calls.count()

    await delay(50);

    expect(job.spy.condition).toHaveBeenCalledTimes(conditionCallsCount);
  });

  it("should handle errors", async () => {
    let error = new Error("test error");
    // @ts-ignore
    let job = longJob(3, error);

    await expectAsync(
      poll(job.isFinish, { interval: 20 })
    ).toBeRejectedWith(error);
  });

  it("should work with async test function", async () => {
    let job = longJob(3);
    let result = await poll(job.asyncIsFinish, { interval: 20 })

    expect(result).toBeTruthy()
    expect(job.spy.condition).toHaveBeenCalledTimes(3);
  });
});

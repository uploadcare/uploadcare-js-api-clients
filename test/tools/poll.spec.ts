import { CancelablePromise, poll } from "../../src/tools/poll";
import CancelError from "../../src/errors/CancelError";
import TimeoutError from "../../src/errors/TimeoutError";

let longJob = (attemps, fails = null) => {
  let runs = 1;
  let condition = jasmine.createSpy("condition");
  let cancel = jasmine.createSpy("cancelCondition");

  let isFinish = () =>
    CancelablePromise(
      new Promise((resolve, reject) => {
        condition();
        if (runs === attemps) {
          fails ? reject(fails) : resolve(true);
        } else {
          runs += 1;
          resolve(false);
        }
      }),
      cancel
    );

  return {
    isFinish,
    spy: {
      condition,
      cancel
    }
  };
};

describe("poll", () => {
  it("should be resolved", async () => {
    let job = longJob(3);
    let result = await poll(job.isFinish, { interval: 300 });

    expect(result).toBeTruthy();
    expect(job.spy.condition).toHaveBeenCalledTimes(3);
    expect(job.spy.cancel).not.toHaveBeenCalled();
  });

  it("should be able to cancel polling sync", async () => {
    let job = longJob(3);
    let polling = poll(job.isFinish, { interval: 300 });

    // @ts-ignore
    polling.cancel();

    await expectAsync(Promise.resolve(polling)).toBeRejectedWith(
      new CancelError()
    );

    expect(job.spy.condition).not.toHaveBeenCalled();
    expect(job.spy.cancel).not.toHaveBeenCalled();
  });

  it("should be able to cancel polling async", async () => {
    let job = longJob(3);
    let polling = poll(job.isFinish, { interval: 300 });

    setTimeout(() => {
      // @ts-ignore
      polling.cancel();
    }, 10);

    await expectAsync(Promise.resolve(polling)).toBeRejectedWith(
      new CancelError()
    );

    expect(job.spy.condition).toHaveBeenCalledTimes(1);
    expect(job.spy.cancel).toHaveBeenCalledTimes(1);
  });

  it("should be able to cancel polling async after first request", async () => {
    let job = longJob(3);
    let polling = poll(job.isFinish, { interval: 300 });

    setTimeout(() => {
      // @ts-ignore
      polling.cancel();
    }, 350);

    await expectAsync(Promise.resolve(polling)).toBeRejectedWith(
      new CancelError()
    );

    expect(job.spy.condition).toHaveBeenCalledTimes(2);
    expect(job.spy.cancel).toHaveBeenCalledTimes(1);
  });

  it("should fails with timeout error", async () => {
    let job = longJob(3);
    let polling = poll(job.isFinish, { interval: 200, timeout: 100 });

    await expectAsync(Promise.resolve(polling)).toBeRejectedWith(
      new TimeoutError("poll timeout")
    );
  });

  it("should handle errors", async () => {
    let error = new Error("test error");
    // @ts-ignore
    let job = longJob(5, error);
    let polling = poll(job.isFinish, { interval: 100 });

    await expectAsync(Promise.resolve(polling)).toBeRejectedWith(error);
  });
});

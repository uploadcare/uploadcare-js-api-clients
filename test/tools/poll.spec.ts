import poll from "../../src/tools/poll";
import CancelError from '../../src/errors/CancelError'

let CancelablePromise = (promise, cancel) => ({
  then: promise.then.bind(promise),
  cancel
});

let loongJob = (attemps, fails = false) => {
  let runs = 1;
  let condition = jasmine.createSpy("condition");
  let cancel = jasmine.createSpy("cancelCondition");

  let isFinish = () =>
    CancelablePromise(
      new Promise((resolve, reject) => {
        condition();
        if (runs === attemps) {
          resolve(true);
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
    let job = loongJob(3);
    let result = await poll(job.isFinish, 300);

    expect(result).toBeTruthy();
    expect(job.spy.condition).toHaveBeenCalledTimes(3);
    expect(job.spy.cancel).not.toHaveBeenCalled();
  });

  it("should be able to cancel polling sync", async () => {
    let job = loongJob(3);
    let polling = poll(job.isFinish, 300);

    // @ts-ignore
    polling.cancel();

    await expectAsync(polling).toBeRejectedWith(new CancelError())

    expect(job.spy.condition).not.toHaveBeenCalled();
    expect(job.spy.cancel).not.toHaveBeenCalled();
  });

  it("should be able to cancel polling async", async () => {
    let job = loongJob(3);
    let polling = poll(job.isFinish, 300);

    setTimeout(() => {
      // @ts-ignore
      polling.cancel();
    }, 10);

    await expectAsync(polling).toBeRejectedWith(new CancelError());

    expect(job.spy.condition).toHaveBeenCalledTimes(1);
    expect(job.spy.cancel).toHaveBeenCalledTimes(1);
  });

  it("should be able to cancel polling async after first request", async () => {
    let job = loongJob(3);
    let polling = poll(job.isFinish, 300);

    setTimeout(() => {
      // @ts-ignore
      polling.cancel();
    }, 350);

    await expectAsync(polling).toBeRejectedWith(new CancelError());

    expect(job.spy.condition).toHaveBeenCalledTimes(2);
    expect(job.spy.cancel).toHaveBeenCalledTimes(1);
  });
});

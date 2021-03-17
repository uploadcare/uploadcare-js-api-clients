import { poll, CheckFunction } from '../../src/tools/poll'
import CancelController from '../../src/tools/CancelController'
import { delay } from '../../src/tools/delay'
import { UploadClientError } from '../../src/tools/errors'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const longJob = (attemps: number, fails: Error | null = null) => {
  let runs = 1
  const condition = jest.fn()
  const cancel = jest.fn()

  const isFinish: CheckFunction<boolean> = (cancelCrtl) => {
    condition()

    if (cancelCrtl) {
      cancelCrtl.onCancel(cancel)
    }

    if (runs === attemps) {
      if (fails) {
        throw fails
      }

      return true
    } else {
      runs += 1
      return false
    }
  }

  const asyncIsFinish: CheckFunction<boolean> = (cancel) =>
    new Promise<boolean>((resolve, reject) => {
      try {
        resolve(isFinish(cancel))
      } catch (error) {
        reject(error)
      }
    })

  return {
    isFinish,
    asyncIsFinish,
    spy: {
      condition,
      cancel
    }
  }
}

describe('poll', () => {
  it('should be resolved', async () => {
    const job = longJob(3)
    const result = await poll({ check: job.isFinish, interval: 10 })

    expect(result).toBeTruthy()
    expect(job.spy.condition).toHaveBeenCalledTimes(3)
    expect(job.spy.cancel).not.toHaveBeenCalled()
  })

  it('should be able to cancel polling async', async () => {
    const job = longJob(3)
    const ctrl = new CancelController()

    ctrl.cancel()

    await expect(
      poll({ check: job.isFinish, interval: 20, cancel: ctrl })
    ).rejects.toThrowError(new UploadClientError('Poll cancelled'))

    expect(job.spy.condition).not.toHaveBeenCalled()
    expect(job.spy.cancel).not.toHaveBeenCalled()
  })

  it('should not run any logic after cancel', async () => {
    const job = longJob(10)
    const ctrl = new CancelController()

    ctrl.cancel()

    await expect(
      poll({ check: job.isFinish, interval: 20, cancel: ctrl })
    ).rejects.toThrowError(new UploadClientError('Poll cancelled'))

    const conditionCallsCount = job.spy.condition.mock.calls.length
    const cancelCallsCount = job.spy.cancel.mock.calls.length

    await delay(50)

    expect(job.spy.condition).toHaveBeenCalledTimes(conditionCallsCount)
    expect(job.spy.cancel).toHaveBeenCalledTimes(cancelCallsCount)
  })

  it('should be able to cancel polling async after first request', async () => {
    const job = longJob(10)
    const ctrl = new CancelController()

    setTimeout(() => {
      ctrl.cancel()
    }, 100)

    await expect(
      poll({ check: job.isFinish, interval: 60, cancel: ctrl })
    ).rejects.toThrowError(new UploadClientError('Poll cancelled'))

    expect(job.spy.condition).toHaveBeenCalledTimes(2)
    expect(job.spy.cancel).toHaveBeenCalledTimes(2)
  })

  it('should not run any logic after cancel', async () => {
    const job = longJob(30)
    const ctrl = new CancelController()

    setTimeout(() => {
      ctrl.cancel()
    }, 50)

    await expect(
      poll({ check: job.isFinish, interval: 10, cancel: ctrl })
    ).rejects.toThrowError(new UploadClientError('Poll cancelled'))

    const conditionCallsCount = job.spy.condition.mock.calls.length

    await delay(50)

    expect(job.spy.condition).toHaveBeenCalledTimes(conditionCallsCount)
  })

  it('should handle errors', async () => {
    const error = new Error('test error')
    const job = longJob(3, error)

    await expect(
      poll({ check: job.isFinish, interval: 20 })
    ).rejects.toThrowError(error)
  })

  it('should handle async errors', async () => {
    const error = new Error('test error')
    const job = longJob(3, error)

    await expect(
      poll({ check: job.asyncIsFinish, interval: 20 })
    ).rejects.toThrowError(error)
  })

  it('should work with async test function', async () => {
    const job = longJob(3)
    const result = await poll({ check: job.asyncIsFinish, interval: 20 })

    expect(result).toBeTruthy()
    expect(job.spy.condition).toHaveBeenCalledTimes(3)
  })
})

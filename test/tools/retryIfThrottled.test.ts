import retryIfThrottled from '../../src/tools/retryIfThrottled'
import { UploadClientError } from '../../src/errors/errors'

let createRunner = (
  { attempts = 10, error, resolve = 0 }:
  { attempts?: Number, error?: Error, resolve?: number } = {}
) => {
  let runs = 0
  let spy = jasmine.createSpy('task')

  let task = () => Promise.resolve().then(() => {
    ++runs

    spy()

    if (runs <= attempts) {
      throw error ? error :
        new UploadClientError('test error', undefined, { statusCode: 429, content: 'test' }, { 'x-throttle-wait-seconds': '1' })
    }

    return resolve
  })

  return { spy, task }

}

describe('retryIfThrottled', () => {
  it('should work', async () => {
    let { spy, task } = createRunner({ attempts: 1 })

    await expectAsync(retryIfThrottled<number>(task, 10)).toBeResolvedTo(0)
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('should rejected with error if no Throttled', async () => {
    let error = new Error()
    let { spy, task } = createRunner({ error })

    await expectAsync(retryIfThrottled<number>(task, 2)).toBeRejectedWith(error)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should rejected with UploadClientError if MaxTimes = 0', async () => {
    let { spy, task } = createRunner()

    await expectAsync(retryIfThrottled<number>(task, 0)).toBeRejectedWithError(UploadClientError)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should resolve if task resolve', async () => {
    let { spy, task } = createRunner({ attempts: 3, resolve: 100 })

    await expectAsync(retryIfThrottled<number>(task, 10)).toBeResolvedTo(100)
    expect(spy).toHaveBeenCalledTimes(4)
  })

  it('should resolve without errors if task resolve', async () => {
    let { spy, task } = createRunner({ attempts: 0 })

    await expectAsync(retryIfThrottled<number>(task, 10)).toBeResolvedTo(0)
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

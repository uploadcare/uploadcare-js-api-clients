import { delay } from '../../src/tools/delay'

const runWithConcurrency = <T>(
  concurrency: number,
  tasks: (() => Promise<T>)[]
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    let rejected = false
    let settled = tasks.length
    const tyRun = [...tasks]

    const run = (): void => {
      const index = tasks.length - tyRun.length
      const next = tyRun.shift()
      if (next) {
        next()
          .then((result: T) => {
            if (rejected) return

            results[index] = result
            settled -= 1
            if (settled) {
              run()
            } else {
              resolve(results)
            }
          })
          .catch(error => {
            rejected = true
            reject(error)
          })
      }
    }

    for (let i = 0; i < concurrency; i++) {
      run()
    }
  })
}

const returnAfter = (value: number, ms = 10): (() => Promise<number>) => () =>
  delay(ms).then(() => value)

const rejectAfter = (error: Error, ms = 10): (() => Promise<never>) => () =>
  delay(ms).then(() => Promise.reject(error))

describe('queueRunner', () => {
  it('should work', async () => {
    await expectAsync(
      runWithConcurrency(1, [returnAfter(1), returnAfter(2), returnAfter(3)])
    ).toBeResolvedTo([1, 2, 3])
  })

  it('should work with big concurrency', async () => {
    await expectAsync(
      runWithConcurrency(20, [returnAfter(1), returnAfter(2), returnAfter(3)])
    ).toBeResolvedTo([1, 2, 3])
  })

  it('should return arrat with rigth order', async () => {
    await expectAsync(
      runWithConcurrency(2, [
        returnAfter(1, 100),
        returnAfter(2),
        returnAfter(3),
        returnAfter(4, 100),
        returnAfter(5),
        returnAfter(6)
      ])
    ).toBeResolvedTo([1, 2, 3, 4, 5, 6])
  })

  it('should reject if any task fails', async () => {
    const error = new Error('test')
    await expectAsync(
      runWithConcurrency(2, [
        returnAfter(1),
        rejectAfter(error),
        returnAfter(3)
      ])
    ).toBeRejectedWith(error)
  })
})

import retrier from '../../src/tools/retry'

describe('retrier', () => {
  test('retry function should work with delay parameter', async () => {
    const a = await retrier(({ attempt, retry }) =>
      Promise.resolve().then(() => {
        if (attempt < 10) {
          return retry(10)
        } else {
          return 10
        }
      })
    )

    expect(a).toBe(10)
  })

  test('retry function should work without delay parameter', async () => {
    const func = jest.fn()

    const a = await retrier(({ attempt, retry }) =>
      Promise.resolve().then(() => {
        func()
        if (attempt < 2) {
          return retry()
        } else {
          return 10
        }
      })
    )

    expect(a).toBe(10)
    expect(func).toHaveBeenCalledTimes(3)
  })

  test('retrier should throw errors', async () => {
    await expect(
      retrier(({ attempt, retry }) =>
        Promise.resolve().then(() => {
          if (attempt < 2) {
            return retry(10)
          } else {
            throw Error('hello error')
          }
        })
      )
    ).rejects.toThrowError('hello error')
  })
})

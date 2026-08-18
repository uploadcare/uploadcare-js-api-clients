import { delay } from './delay'

describe('delay', () => {
  it('should resolve promise after specified timeout', async () => {
    const start = Date.now()
    await delay(100)
    const end = Date.now()
    expect(end - start).toBeGreaterThan(100 - 10)
  })

  it('should resolve early when the signal aborts', async () => {
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 20)

    const start = Date.now()
    await delay(1000, ctrl.signal)

    expect(Date.now() - start).toBeLessThan(500)
  })

  it('should resolve immediately when the signal is already aborted', async () => {
    const ctrl = new AbortController()
    ctrl.abort()

    const start = Date.now()
    await delay(1000, ctrl.signal)

    expect(Date.now() - start).toBeLessThan(100)
  })
})

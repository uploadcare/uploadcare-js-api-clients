import { delay } from './delay'

describe('delay', () => {
  it('should resolve promise after specified timeout', async () => {
    const start = Date.now()
    await delay(100)
    const end = Date.now()
    expect(end - start).toBeGreaterThanOrEqual(100)
  })
})

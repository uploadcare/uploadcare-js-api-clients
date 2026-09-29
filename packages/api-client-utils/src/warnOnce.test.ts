import { jest, expect } from '@jest/globals'
import { warnOnce } from './warnOnce'

describe('warnOnce', () => {
  let warnSpy: ReturnType<typeof jest.spyOn>

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('should warn the first time and stay silent after', () => {
    // Both halves live in one test: the deduplication is module-level state
    // that nothing resets, so split across two the second would pass only
    // because the first ran before it.
    warnOnce('first message')
    warnOnce('first message')
    warnOnce('first message')

    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith('first message')
  })

  it('should warn separately for a different message', () => {
    warnOnce('second message')

    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith('second message')
  })
})

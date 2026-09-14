import { expect, jest } from '@jest/globals'
import { getSecureParams } from '../../src/tools/getSecureParams'

describe('getSecureParams', () => {
  let warnSpy: ReturnType<typeof jest.spyOn>

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('should pass the signature params through without authToken', () => {
    expect(
      getSecureParams({ secureSignature: 'signature', secureExpire: '123' })
    ).toEqual({ signature: 'signature', expire: '123' })
    expect(getSecureParams({})).toEqual({
      signature: undefined,
      expire: undefined
    })
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('should drop nothing and stay silent with authToken alone', () => {
    expect(getSecureParams({ authToken: 'jwt' })).toEqual({})
    expect(warnSpy).not.toHaveBeenCalled()
  })

  // The warning is deduplicated per process, so its two aspects (fires on the
  // first conflict, stays silent afterwards) must be tested in this order.
  it('should warn on the first conflict between the auth schemes', () => {
    const params = getSecureParams({
      authToken: 'jwt',
      secureSignature: 'signature',
      secureExpire: '123'
    })

    expect(params).toEqual({})
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toContain('`authToken` takes precedence')
  })

  it('should not warn again on subsequent conflicts', () => {
    getSecureParams({ authToken: 'jwt', secureSignature: 'signature' })

    expect(warnSpy).not.toHaveBeenCalled()
  })
})

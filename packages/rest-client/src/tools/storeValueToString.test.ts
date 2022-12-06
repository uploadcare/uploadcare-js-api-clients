import { storeValueToString } from './storeValueToString'

describe('storeValueToString', () => {
  it('should convert boolean to string', () => {
    expect(storeValueToString(true)).toBe('true')
    expect(storeValueToString(false)).toBe('false')
  })

  it('should return undefined when falsy value passed', () => {
    expect(storeValueToString()).toBe(undefined)
    expect(storeValueToString(undefined)).toBe(undefined)
  })

  it('should return undefined when "auto" passed', () => {
    expect(storeValueToString('auto')).toBe(undefined)
  })

  it('should throw a error when other type passed', () => {
    expect(() => storeValueToString(12 as unknown as boolean)).toThrowError()
  })
})

import { getStoreValue } from '../../src/tools/getStoreValue'

describe('getStoreValue', () => {
  it('should return auto by default', () => {
    expect(getStoreValue()).toEqual('auto')
  })

  it('should return auto if store is auto', () => {
    expect(getStoreValue('auto')).toEqual('auto')
  })

  it('should return `1` if store is true', () => {
    expect(getStoreValue(true)).toEqual('1')
  })

  it('should return `0` if store is false', () => {
    expect(getStoreValue(false)).toEqual('0')
  })
})

import { isObject } from './isObject'

describe('isObject', () => {
  it('should work', () => {
    expect(isObject({})).toBe(true)
    expect(isObject([])).toBe(false)
    expect(isObject(1)).toBe(false)
    expect(isObject()).toBe(false)
    expect(isObject(true)).toBe(false)
  })
})

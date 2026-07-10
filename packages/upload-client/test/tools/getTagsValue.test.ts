import { getTagsValue } from '../../src/tools/getTagsValue'

describe('getTagsValue', () => {
  it('should return undefined by default', () => {
    expect(getTagsValue()).toBeUndefined()
  })

  it('should join an array of tags with a comma', () => {
    expect(getTagsValue(['list', 'cat'])).toEqual('list,cat')
  })

  it('should return an empty string for an empty array', () => {
    expect(getTagsValue([])).toEqual('')
  })

  it('should pass an already-serialized string through', () => {
    expect(getTagsValue('list,cat')).toEqual('list,cat')
  })

  it('should return undefined for non-array, non-string values', () => {
    // @ts-expect-error testing runtime robustness against untyped input
    expect(getTagsValue(42)).toBeUndefined()
    // @ts-expect-error testing runtime robustness against untyped input
    expect(getTagsValue({})).toBeUndefined()
    // @ts-expect-error testing runtime robustness against untyped input
    expect(getTagsValue(null)).toBeUndefined()
  })
})

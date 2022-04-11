import buildFormData, { getFormDataParams } from '../../src/tools/buildFormData'
import * as factory from '../_fixtureFactory'

describe('buildFormData', () => {
  it('should return FormData with nice input object', () => {
    const data = buildFormData({
      file: {
        data: factory.image('blackSquare').data,
        name: 'file.jpeg'
      },
      UPLOADCARE_PUB_KEY: factory.publicKey('demo')
    })

    expect(data).toBeDefined()
    expect(typeof data).toBe('object')
    expect(typeof data.append).toBe('function')
  })

  it('should support objects', () => {
    const data = buildFormData({
      test: { key: 'value' },
      test2: 'test'
    })

    expect(data).toBeDefined()
    expect(typeof data).toBe('object')
    expect(typeof data.append).toBe('function')
  })
})

describe('getFormDataParams', () => {
  it('should accept string parameters', () => {
    const params = getFormDataParams({
      key: 'value'
    })

    expect(params).toContainEqual(['key', 'value'])
  })

  it('should convert numbers to strings', () => {
    const params = getFormDataParams({
      key: '1234'
    })

    expect(params).toContainEqual(['key', '1234'])
  })

  it('should not include non-boolean falsy values', () => {
    const params = getFormDataParams({
      key1: 'value1',
      key2: null as never,
      key3: undefined,
      key4: ''
    })

    expect(params).toContainEqual(['key1', 'value1'])
    expect(params.length).toEqual(1)
  })

  it('should not process boolean values', () => {
    const params = getFormDataParams({
      key1: true as never,
      key2: false as never
    })

    expect(params.length).toEqual(0)
  })

  it('should not process arrays', () => {
    const params = getFormDataParams({
      key1: ['1', 2, '3'] as never
    })

    expect(params.length).toEqual(0)
  })

  it('should accept key-value objects, transforming any defined values to string', () => {
    const params = getFormDataParams({
      key1: {
        k1: 'v1',
        k2: 2,
        k3: true,
        k4: false,
        k5: undefined,
        k6: null,
        k7: {}
      } as never,
      key2: {
        k1: 'v1'
      }
    })

    expect(params.length).toEqual(7)

    expect(params).toContainEqual(['key1[k1]', 'v1'])
    expect(params).toContainEqual(['key1[k2]', '2'])
    expect(params).toContainEqual(['key1[k3]', 'true'])
    expect(params).toContainEqual(['key1[k4]', 'false'])
    expect(params).toContainEqual(['key1[k6]', 'null'])
    expect(params).toContainEqual(['key1[k7]', '[object Object]'])

    expect(params).toContainEqual(['key2[k1]', 'v1'])
  })

  it('should accept key-value objects, ignoring undefined values', () => {
    const params = getFormDataParams({
      key1: {
        k1: 'v1',
        k2: undefined
      } as never
    })

    expect(params.length).toEqual(1)

    expect(params).toContainEqual(['key1[k1]', 'v1'])
  })

  it('should process file descriptions', () => {
    const fileToUpload = factory.image('blackSquare').data

    const params = getFormDataParams({
      file1: {
        data: fileToUpload,
        name: ''
      },
      file2: {
        data: fileToUpload,
        name: 'filename'
      }
    })

    expect(params.length).toEqual(2)

    expect(params).toContainEqual(['file1', fileToUpload])
    expect(params).toContainEqual(['file2', fileToUpload, 'filename'])
  })
})

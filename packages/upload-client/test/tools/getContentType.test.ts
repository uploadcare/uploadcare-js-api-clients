// @vitest-environment jsdom
import { getContentType } from '../../src/tools/getContentType'

describe('getContentType', () => {
  it('should return content type of Blob', () => {
    const blob = new Blob([''], { type: 'text/plain' })
    expect(getContentType(blob)).toEqual('text/plain')
  })

  it('should return content type of File', () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' })
    expect(getContentType(file)).toEqual('text/plain')
  })

  it('should return content type of ReactNative asset', () => {
    const asset = { uri: 'file://data', name: 'test.txt', type: 'text/plain' }
    expect(getContentType(asset)).toEqual('text/plain')
  })

  it('should return fallback value if no type found', () => {
    const blob = new Blob([''])
    expect(getContentType(blob)).toEqual('application/octet-stream')

    const file = new File([''], 'test.txt')
    expect(getContentType(file)).toEqual('application/octet-stream')

    const asset = { uri: 'file://data', name: 'test.txt', type: '' }
    expect(getContentType(asset)).toEqual('application/octet-stream')
  })
})

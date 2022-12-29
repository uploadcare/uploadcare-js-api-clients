/**
 * @jest-environment jsdom
 */
import { expect } from '@jest/globals'
import { getFileName } from '../../src/tools/getFileName'

describe('getFileName', () => {
  it('should return filename of File', () => {
    const file = new File([''], 'test.txt')
    expect(getFileName(file)).toEqual('test.txt')
  })

  it('should return filename of ReactNative asset', () => {
    const asset = { uri: 'file://data', name: 'test.txt', type: 'text/plain' }
    expect(getFileName(asset)).toEqual('test.txt')
  })

  it('should return fallback value if no filename found', () => {
    const blob = new Blob([''])
    expect(getFileName(blob)).toEqual('original')

    const file = new File([''], '')
    expect(getFileName(file)).toEqual('original')

    const buffer = Buffer.from('')
    expect(getFileName(buffer)).toEqual('original')

    const asset = { uri: 'file://data', name: '', type: 'text/plain' }
    expect(getFileName(asset)).toEqual('original')
  })
})

// @vitest-environment jsdom
import { expect, vi } from 'vitest'
import { getFileSize } from '../../src/tools/getFileSize'

global.fetch = vi.fn(() =>
  Promise.resolve({
    blob: () => new Blob(['111'])
  })
) as unknown as typeof fetch

beforeEach(() => (fetch as vi.Mock).mockClear())

describe('getFileSize', () => {
  it('should return size of File', async () => {
    const file = new File(['111'], 'test.txt')
    await expect(getFileSize(file)).resolves.toEqual(3)
  })

  it('should return size of Blob', async () => {
    const blob = new Blob(['111'])
    await expect(getFileSize(blob)).resolves.toEqual(3)
  })

  it('should return size of Buffer', async () => {
    const buffer = Buffer.from('111')
    await expect(getFileSize(buffer)).resolves.toEqual(3)
  })

  it('should return size of ReactNative asset', async () => {
    const asset = { uri: 'file://data', name: 'test.txt', type: 'text/plain' }
    await expect(getFileSize(asset)).resolves.toEqual(3)
  })

  it('should throw error if no size found', async () => {
    const unknownFile = { unknown: 'file' }
    await expect(
      getFileSize(unknownFile as unknown as Blob)
    ).rejects.toThrowError('Unknown file type. Cannot determine file size.')
  })
})

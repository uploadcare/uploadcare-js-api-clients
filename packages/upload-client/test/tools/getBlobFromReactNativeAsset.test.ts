// @vitest-environment jsdom
import { getBlobFromReactNativeAsset } from '../../src/tools/getBlobFromReactNativeAsset'
import { expect, vi } from 'vitest'

global.fetch = vi.fn(() =>
  Promise.resolve({
    blob: () => new Blob(['111'])
  })
) as unknown as typeof fetch

beforeEach(() => (global.fetch as vi.Mock).mockClear())

describe('getBlobFromReactNativeAsset', () => {
  it('should convert ReactNative asset as Blob', async () => {
    const asset = { uri: 'file://data', name: '', type: 'text/plain' }
    const blob = await getBlobFromReactNativeAsset(asset)
    expect(blob instanceof Blob).toBeTruthy()
    expect(global.fetch).toBeCalledTimes(1)
  })

  it('should memoize results', async () => {
    const asset = { uri: 'file://data', name: '', type: 'text/plain' }

    const blob1 = await getBlobFromReactNativeAsset(asset)
    expect(blob1 instanceof Blob).toBeTruthy()

    const blob2 = await getBlobFromReactNativeAsset(asset)
    expect(blob2 instanceof Blob).toBeTruthy()

    expect(global.fetch).toBeCalledTimes(1)
  })
})

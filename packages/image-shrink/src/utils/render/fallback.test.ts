/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest'
import { fallback } from './fallback'
import { loadImageAsBlob } from '../../test/helpers/loadImageAsBlob'
import { imageLoader } from '../../utils/image/imageLoader'

describe('fallback', () => {
  it('should work', async () => {
    const originalFile = await loadImageAsBlob(
      () => import('../../test/samples/2000x2000.jpeg')
    )
    const image = await imageLoader(URL.createObjectURL(originalFile))
    URL.revokeObjectURL(image.src)

    const canvas = await fallback({
      img: image,
      sourceW: image.width,
      targetW: 100,
      targetH: 100,
      step: 0.71
    })

    expect(canvas.width).toBe(100)
  })

  it('should throw if not supported', async () => {
    const originalFile = await loadImageAsBlob(
      () => import('../../test/samples/2000x2000.jpeg')
    )
    const image = await imageLoader(URL.createObjectURL(originalFile))
    URL.revokeObjectURL(image.src)

    const promise = fallback({
      img: image,
      sourceW: image.width,
      targetW: 65535 + 1,
      targetH: 65535 + 1,
      step: 0.71
    })
    expect(promise).rejects.toThrow('Not supported')
  })
})

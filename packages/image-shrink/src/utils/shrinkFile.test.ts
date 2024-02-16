/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest'
import { getImageAttributes } from '../test/helpers/getImageAttributes'
import { readMagickImage } from '../test/helpers/readMagickImage'
import { loadImageAsBlob } from '../test/helpers/loadImageAsBlob'
import { shrinkFile } from './shrinkFile'
import { type IMagickImage } from '@imagemagick/magick-wasm'

describe('shrinkFile', () => {
  it('should shrink the image', async () => {
    const originalFile = await loadImageAsBlob(
      () => import('../test/samples/2000x2000.jpeg')
    )
    const shrinkedBlob = await shrinkFile(originalFile, {
      size: 100
    })
    expect(shrinkedBlob.size).toBeLessThan(originalFile.size)
    expect(shrinkedBlob.size).toBeLessThan(1000)

    const { width, height } = await readMagickImage(shrinkedBlob, (image) => ({
      width: image.width,
      height: image.height
    }))
    expect(width).toBe(10)
    expect(height).toBe(10)
  })

  it("should skip shrink if it's not required", async () => {
    const originalFile = await loadImageAsBlob(
      () => import('../test/samples/2000x2000.jpeg')
    )
    const promise = shrinkFile(originalFile, {
      size: 2000 * 2000
    })
    expect(promise).rejects.toThrowError('Not required')
  })

  it('should keep transparent PNG as PNG', async () => {
    const originalFile = await loadImageAsBlob(
      () => import('../test/samples/transparent.png')
    )
    const shrinkedBlob = await shrinkFile(originalFile, {
      size: 100
    })

    const { hasAlpha, format } = await readMagickImage(
      shrinkedBlob,
      (image) => ({
        hasAlpha: image.hasAlpha,
        format: image.format
      })
    )
    expect(hasAlpha).toBe(true)
    expect(format).toBe('PNG')
  })

  it('should convert non-transparent PNG to JPEG', async () => {
    const originalFile = await loadImageAsBlob(
      () => import('../test/samples/not-transparent.png')
    )
    const shrinkedBlob = await shrinkFile(originalFile, {
      size: 100
    })

    const { hasAlpha, format } = await readMagickImage(
      shrinkedBlob,
      (image) => ({
        hasAlpha: image.hasAlpha,
        format: image.format
      })
    )
    expect(hasAlpha).toBe(false)
    expect(format).toBe('JPEG')
  })

  it('should keep EXIF', async () => {
    const originalFile = await loadImageAsBlob(
      () => import('../test/samples/exif-without-orientation.jpg')
    )
    const shrinkedBlob = await shrinkFile(originalFile, {
      size: 2
    })
    const filterExifAttributes = (attrs: Record<string, string>) =>
      Object.fromEntries(
        Object.entries(attrs).filter(([key]) => key.startsWith('exif:'))
      )
    const originalExif =
      await getImageAttributes(originalFile).then(filterExifAttributes)
    const shrinkedExif =
      await getImageAttributes(shrinkedBlob).then(filterExifAttributes)

    expect(originalExif).toEqual(shrinkedExif)
  })

  it('should keep ICC', async () => {
    const originalFile = await loadImageAsBlob(
      () => import('../test/samples/with-icc-profile.jpg')
    )
    const shrinkedBlob = await shrinkFile(originalFile, {
      size: 2
    })

    const filterIccAttributes = (attrs: Record<string, string>) =>
      Object.fromEntries(
        Object.entries(attrs).filter(([key]) => key.startsWith('icc:'))
      )
    const originalIccAttributes =
      await getImageAttributes(originalFile).then(filterIccAttributes)
    const shrinkedIccAttributes =
      await getImageAttributes(shrinkedBlob).then(filterIccAttributes)

    expect(originalIccAttributes).toEqual(shrinkedIccAttributes)
  })

  it.skip('should not apply existing ICC when shrinking image', async () => {
    const originalFile = await loadImageAsBlob(
      () => import('../test/samples/icc-strip-test.jpg')
    )
    const shrinkedBlob = await shrinkFile(originalFile, {
      size: 300 * 300,
      quality: 1
    })

    const readTopLeftPixel = (image: IMagickImage) => {
      return new Promise((resolve) => {
        image.getPixels((pixelsCollection) => {
          resolve(pixelsCollection.getPixel(0, 0))
          pixelsCollection.dispose()
        })
      })
    }

    const originalPixel = await readMagickImage(originalFile, readTopLeftPixel)
    const shrinkedPixel = await readMagickImage(shrinkedBlob, readTopLeftPixel)

    expect(originalPixel).toEqual(shrinkedPixel)
  })
})

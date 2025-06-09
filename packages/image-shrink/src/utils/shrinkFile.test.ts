/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest'
import { getImageAttributes } from '../test/helpers/getImageAttributes'
import { loadImageAsBlob } from '../test/helpers/loadImageAsBlob'
import { readMagickImage } from '../test/helpers/readMagickImage'
import { uploadImage } from '../test/helpers/uploadImage'
import { shrinkFile } from './shrinkFile'

describe('shrinkFile', () => {
  it('should shrink the image', async (ctx) => {
    const originalFile = await loadImageAsBlob(
      () => import('../test/samples/2000x2000.jpeg')
    )
    const shrinkedBlob = await shrinkFile(originalFile, {
      size: 500 * 500,
      quality: 0.1
    })

    await Promise.all([
      uploadImage(originalFile, 'original', ctx),
      uploadImage(shrinkedBlob, 'shrinked', ctx)
    ])

    expect(shrinkedBlob.size).toBeLessThan(originalFile.size)
    expect(shrinkedBlob.size).toBeLessThan(5000)

    const { width, height } = await readMagickImage(shrinkedBlob, (image) => ({
      width: image.width,
      height: image.height
    }))
    expect(width).toBe(500)
    expect(height).toBe(500)
  })

  it('should throw a error if the passed file is not an image', async () => {
    const originalFile = new Blob(['Hello world'], { type: 'text/plain' })
    const promise = shrinkFile(originalFile, {
      size: 100 * 100
    })
    await expect(promise).rejects.toThrowError('not an image')
  })

  it('should throw a error if unable to convert canvas to blob', async () => {
    const originalFile = await loadImageAsBlob(
      () => import('../test/samples/line.jpg')
    )
    const promise = shrinkFile(originalFile, {
      size: 100 * 100
    })
    await expect(promise).rejects.toThrowError(
      'Failed to convert canvas to blob'
    )
  })

  it("should skip shrink if it's not required and throw a error", async () => {
    const originalFile = await loadImageAsBlob(
      () => import('../test/samples/2000x2000.jpeg')
    )
    const promise = shrinkFile(originalFile, {
      size: 2000 * 2000
    })
    await expect(promise).rejects.toThrowError('Not required')
  })

  it('should keep transparent PNG as PNG', async (ctx) => {
    const originalFile = await loadImageAsBlob(
      () => import('../test/samples/transparent.png')
    )
    const shrinkedBlob = await shrinkFile(originalFile, {
      size: 100 * 100
    })

    await Promise.all([
      uploadImage(originalFile, 'original', ctx),
      uploadImage(shrinkedBlob, 'shrinked', ctx)
    ])

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

  it('should convert non-transparent PNG to JPEG', async (ctx) => {
    const originalFile = await loadImageAsBlob(
      () => import('../test/samples/not-transparent.png')
    )
    const shrinkedBlob = await shrinkFile(originalFile, {
      size: 100 * 100
    })

    await Promise.all([
      uploadImage(originalFile, 'original', ctx),
      uploadImage(shrinkedBlob, 'shrinked', ctx)
    ])

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

  it('should keep EXIF', async (ctx) => {
    const originalFile = await loadImageAsBlob(
      () => import('../test/samples/exif-without-orientation.jpg')
    )
    const shrinkedBlob = await shrinkFile(originalFile, {
      size: 50 * 50
    })

    await Promise.all([
      uploadImage(originalFile, 'original', ctx),
      uploadImage(shrinkedBlob, 'shrinked', ctx)
    ])

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

  it('should keep ICC', async (ctx) => {
    const originalFile = await loadImageAsBlob(
      () => import('../test/samples/with-icc-profile.jpg')
    )
    const shrinkedBlob = await shrinkFile(originalFile, {
      size: 100 * 100
    })

    await Promise.all([
      uploadImage(originalFile, 'original', ctx),
      uploadImage(shrinkedBlob, 'shrinked', ctx)
    ])

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
})

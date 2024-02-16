/// <reference types="vite/client" />
import { expect, describe, it } from 'vitest'
import { shrinkFile } from './shrinkFile'
import imageUrl from '../test/samples/2000x2000.jpeg'
import { fileFromUrl } from '../test/helpers/fileFromUrl'
import { blobToImage } from '../test/helpers/blobToImage'

describe('shrinkFile', () => {
  it('should shrink the image', async () => {
    const file = await fileFromUrl(imageUrl)
    const blob = await shrinkFile(file, {
      size: 100,
      quality: 0.5
    })
    expect(blob.size).toBeLessThan(file.size)
    expect(blob.size).toBeLessThan(1000)

    const img = await blobToImage(blob)
    expect(img.width).toBe(10)
    expect(img.height).toBe(10)
  })
})

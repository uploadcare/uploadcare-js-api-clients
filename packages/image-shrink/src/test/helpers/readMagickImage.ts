import { loadImageMagick } from './loadImageMagick'
import { type IMagickImage } from '@imagemagick/magick-wasm'

export const readMagickImage = async <T>(
  inputBlob: Blob,
  func: (image: IMagickImage) => T
): Promise<T> => {
  const { ImageMagick } = await loadImageMagick()
  const blobArray = new Uint8Array(await inputBlob.arrayBuffer())
  return new Promise<T>((resolve) => {
    ImageMagick.read(blobArray, (image) => {
      resolve(func(image))
    })
  })
}

import { readJpegChunks } from '../image/JPEG/readJpegChunks'

export const getExif = async (blob: Blob) => {
  let exif: DataView | null = null

  const { promiseReadJpegChunks, stack } = readJpegChunks()

  await promiseReadJpegChunks(blob)

  stack.forEach(({ marker, view }) => {
    if (!exif && marker === 0xe1) {
      if (view.byteLength >= 14) {
        if (
          // check for "Exif\0"
          view.getUint32(0) === 0x45786966 &&
          view.getUint16(4) === 0
        ) {
          exif = view
          return
        }
      }
    }
  })

  return exif
}

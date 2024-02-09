import { readJpegChunks } from '../image/JPEG/readJpegChunks'

export const getExif = async (file: File) => {
  let isExif: DataView | null = null

  const { promiseReadJpegChunks, stack } = readJpegChunks()
  return promiseReadJpegChunks(file)
    .then(() => {
      stack.forEach(({ marker, view }) => {
        if (!isExif && marker === 0xe1) {
          if (view.byteLength >= 14) {
            if (
              // check for "Exif\0"
              view.getUint32(0) === 0x45786966 &&
              view.getUint16(4) === 0
            ) {
              isExif = view
              return isExif
            }
          }
        }

        return isExif
      })
    })
    .catch(() => isExif)
}

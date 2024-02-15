import { readJpegChunks } from './image/JPEG/readJpegChunks'
import { allowLayers, markers } from '../constants'

export const shouldSkipShrink = async (file: File) => {
  let skip = false

  const { promiseReadJpegChunks, stack } = readJpegChunks()

  return await promiseReadJpegChunks(file)
    .then(() => {
      stack.forEach(({ marker, view }) => {
        if (!skip && markers.indexOf(marker) >= 0) {
          const layer = view.getUint8(5)
          if (allowLayers.indexOf(layer) < 0) {
            skip = true
          }
        }
      })

      return skip
    })
    .catch(() => skip)
}

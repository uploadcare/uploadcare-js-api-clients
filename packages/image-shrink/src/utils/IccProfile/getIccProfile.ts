import { readJpegChunks } from '../image/JPEG/readJpegChunks'

export const getIccProfile = async (file: File) => {
  const iccProfile: DataView[] = []
  const { promiseReadJpegChunks, stack } = readJpegChunks()

  return await promiseReadJpegChunks(file)
    .then(() => {
      stack.forEach(({ marker, view }) => {
        if (marker === 0xe2) {
          if (
            // check for "ICC_PROFILE\0"
            view.getUint32(0) === 0x4943435f &&
            view.getUint32(4) === 0x50524f46 &&
            view.getUint32(8) === 0x494c4500
          ) {
            iccProfile.push(view)
          }
        }
      })
      return iccProfile
    })
    .catch(() => iccProfile)
}

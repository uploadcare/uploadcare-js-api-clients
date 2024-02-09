import { replaceJpegChunk } from '../image/JPEG/replaceJpegChunk'
import { findExifOrientation } from './findExifOrientation'

export const setExifOrientation = (exif, orientation) => {
  findExifOrientation(exif, (offset, little) =>
    exif.setUint16(offset, orientation, little)
  )
}
export const replaceExif = async (
  file: File,
  exif: DataView,
  isExifApplied: boolean | unknown
) => {
  if (isExifApplied) {
    setExifOrientation(exif, 1)
  }

  return replaceJpegChunk(file, 0xe1, [exif.buffer])
}

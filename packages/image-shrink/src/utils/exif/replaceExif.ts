import { replaceJpegChunk } from '../image/JPEG/replaceJpegChunk'
import { findExifOrientation } from './findExifOrientation'

export const setExifOrientation = (exif: DataView, orientation: number) => {
  // TODO: rename to littleEndian
  findExifOrientation(exif, (offset, little) =>
    exif.setUint16(offset, orientation, little)
  )
}
export const replaceExif = async (
  // TODO: rename to blob
  file: Blob,
  exif: DataView,
  isExifApplied: boolean
) => {
  if (isExifApplied) {
    setExifOrientation(exif, 1)
  }

  return replaceJpegChunk(file, 0xe1, [exif.buffer])
}

import { replaceJpegChunk } from '../image/JPEG/replaceJpegChunk'
import { findExifOrientation } from './findExifOrientation'

export const setExifOrientation = (exif: DataView, orientation: number) => {
  findExifOrientation(exif, (offset, littleEndian) =>
    exif.setUint16(offset, orientation, littleEndian)
  )
}
export const replaceExif = async (
  blob: Blob,
  exif: DataView,
  isExifApplied: boolean
) => {
  if (isExifApplied) {
    setExifOrientation(exif, 1)
  }

  return replaceJpegChunk(blob, 0xe1, [exif.buffer as ArrayBuffer])
}

import { replaceJpegChunk } from '../image/JPEG/replaceJpegChunk'

export const MARKER = 0xe2
export const replaceIccProfile = (blob: Blob, iccProfiles: DataView[]) => {
  return replaceJpegChunk(
    blob,
    MARKER,
    iccProfiles.map((chunk) => chunk.buffer) as ArrayBuffer[]
  )
}

import { Sliceable } from '../types'

export const sliceChunk = <T extends Sliceable>(
  file: T,
  index: number,
  fileSize: number,
  chunkSize: number
): T => {
  const start = chunkSize * index
  const end = Math.min(start + chunkSize, fileSize)

  return file.slice(start, end) as T
}

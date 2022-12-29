import { Sliceable } from '../types'

type Sliceable<T> = T & { slice: (start: number, end: number) => Sliceable<T> }

export const sliceChunk = <T extends Sliceable>(
  file: Sliceable<T>,
  index: number,
  fileSize: number,
  chunkSize: number
): Sliceable<T> => {
  const start = chunkSize * index
  const end = Math.min(start + chunkSize, fileSize)

  return file.slice(start, end) as Sliceable<T>
}

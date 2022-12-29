import { AnySlicable } from '../types'

type Slicable<T> = T & { slice: (start: number, end: number) => Slicable<T> }

export const sliceChunk = <T extends AnySlicable>(
  file: Slicable<T>,
  index: number,
  fileSize: number,
  chunkSize: number
): Slicable<T> => {
  const start = chunkSize * index
  const end = Math.min(start + chunkSize, fileSize)

  return file.slice(start, end) as Slicable<T>
}

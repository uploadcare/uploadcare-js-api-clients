/* Types */
import {ChunkType} from './types'

/**
 * Split file size to chunks.
 *
 * @param {number} fileSize
 * @param {number} chunkSize
 * @returns {ChunkType[]}
 */
export const getChunks = (fileSize: number, chunkSize: number): ChunkType[] => {
  const chunksCount = Math.ceil(fileSize / chunkSize)

  return Array.apply(null, Array(chunksCount)).map((_, index: number) => {
    const start = chunkSize * index
    const end = Math.min(start + chunkSize, fileSize)

    return [start, end]
  })
}

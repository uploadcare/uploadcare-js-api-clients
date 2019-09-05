/* Types */
import {ChunkType} from './types'

/**
 * Split file size to chunks.
 *
 * @param {number} fileSize - File size.
 * @param {number} chunkSize - Chunk size.
 * @returns {ChunkType[]} - Array of chunks.
 */
export const getChunks = (fileSize: number, chunkSize): ChunkType[] => {
  const chunksCount = Math.ceil(fileSize / chunkSize)

  return Array(...Array(chunksCount)).map((value, index: number) => {
    const start = chunkSize * index
    const end = Math.min(start + chunkSize, fileSize)

    return [start, end]
  })
}

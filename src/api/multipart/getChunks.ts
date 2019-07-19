import {ChunkType} from './types'
import {DEFAULT_PART_SIZE} from '../request/request'

/**
 * Split file size to chunks
 *
 * @param {number} fileSize
 * @param {number} chunkSize
 * @returns {ChunkType[]}
 */
export const getChunks = (fileSize: number, chunkSize = DEFAULT_PART_SIZE): ChunkType[] => {
  const chunksCount = Math.ceil(fileSize / chunkSize)

  return Array.apply(null, Array(chunksCount)).map((value, index: number) => {
    const start = chunkSize * index
    const end = Math.min(start + chunkSize, fileSize)

    return [start, end]
  })
}

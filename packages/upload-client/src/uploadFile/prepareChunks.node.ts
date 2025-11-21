import { SupportedFileInput, NodeFile } from '../types'
import { sliceChunk } from './sliceChunk'
import { PrepareChunks } from './types'

export const prepareChunks: PrepareChunks = async (
  file: SupportedFileInput,
  fileSize: number,
  chunkSize: number
) => {
  return {
    getChunk: (index: number): NodeFile =>
      sliceChunk(file as NodeFile, index, fileSize, chunkSize)
  }
}

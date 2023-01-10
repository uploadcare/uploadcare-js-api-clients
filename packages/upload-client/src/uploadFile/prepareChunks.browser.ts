import { SupportedFileInput, BrowserFile } from '../types'
import { sliceChunk } from './sliceChunk'
import { PrepareChunks } from './types'

export const prepareChunks: PrepareChunks = async (
  file: SupportedFileInput,
  fileSize: number,
  chunkSize: number
) => {
  return (index: number): BrowserFile =>
    sliceChunk(file as BrowserFile, index, fileSize, chunkSize)
}

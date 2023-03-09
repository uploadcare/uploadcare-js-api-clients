import { isReactNativeAsset } from '../tools/isFileData'
import { SupportedFileInput } from '../types'
import { getBlobFromReactNativeAsset } from '../tools/getBlobFromReactNativeAsset'
import { sliceChunk } from './sliceChunk'
import { PrepareChunks } from './types'

/**
 * React-native hack for blob slicing
 *
 * We need to store references to sliced blobs to prevent source blob from being
 * deallocated until uploading complete. Access to deallocated blob causes app
 * crash.
 *
 * See https://github.com/uploadcare/uploadcare-js-api-clients/issues/306 and
 * https://github.com/facebook/react-native/issues/27543
 */
export const prepareChunks: PrepareChunks = async (
  file: SupportedFileInput,
  fileSize: number,
  chunkSize: number
) => {
  let blob: Blob
  if (isReactNativeAsset(file)) {
    blob = await getBlobFromReactNativeAsset(file)
  } else {
    blob = file as Blob
  }

  const chunks: Blob[] = []
  return (index: number): Blob => {
    const chunk = sliceChunk(blob, index, fileSize, chunkSize)
    chunks.push(chunk)
    return chunk
  }
}

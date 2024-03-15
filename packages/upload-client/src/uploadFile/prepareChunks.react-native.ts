import { isReactNativeAsset } from '../tools/isFileData'
import { Sliceable, SupportedFileInput } from '../types'
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
  let blob: Sliceable
  if (isReactNativeAsset(file)) {
    blob = await getBlobFromReactNativeAsset(file)
  } else {
    blob = file as Sliceable
  }

  const chunks: Set<Sliceable> = new Set()
  return {
    getChunk: (index: number): Sliceable => {
      const chunk = sliceChunk(blob, index, fileSize, chunkSize)
      chunks.add(chunk)
      return chunk
    },
    /**
     * Remove references to all the chunks from the memory to make able
     * react-native to deallocate it
     */
    disposeChunks: () => {
      chunks.clear()
    }
  }
}

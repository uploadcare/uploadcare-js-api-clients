import { ReactNativeAsset, SupportedFileInput } from '../types'
import { isBuffer } from './isBuffer.node'

export { isBuffer }

export const isBlob = (data: unknown): data is Blob => {
  return typeof Blob !== 'undefined' && data instanceof Blob
}

export const isFile = (data: unknown): data is File => {
  return typeof File !== 'undefined' && data instanceof File
}

export const isReactNativeAsset = (data: unknown): data is ReactNativeAsset => {
  return (
    !!data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    'uri' in data &&
    typeof (data as Record<'uri', unknown>).uri === 'string'
  )
}

export const isFileData = (data: unknown): data is SupportedFileInput => {
  return (
    isBlob(data) || isFile(data) || isBuffer(data) || isReactNativeAsset(data)
  )
}

import { FileData } from '../types'
import { getFileSize } from '../api/multipart/getFileSize'

/**
 * Check if FileData is multipart data.
 *
 * @param {FileData} data
 * @param {number} multipartMinFileSize
 * @return {boolean}
 */
export const isMultipart = (
  data: FileData,
  multipartMinFileSize: number
): boolean => {
  const fileSize = getFileSize(data)

  return fileSize >= multipartMinFileSize
}

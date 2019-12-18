import { isNode } from '../tools/isNode'

/* Types */
import { FileData } from '../api/types'

/**
 * Get file size.
 *
 * @param {FileData} file
 */
export const getFileSize = (file: FileData): number => {
  return isNode() ? (file as Buffer).length : (file as Blob).size
}

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

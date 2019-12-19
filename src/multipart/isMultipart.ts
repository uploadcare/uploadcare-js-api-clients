/* Types */
import { NodeFile, BrowserFile } from '../request/types'

/**
 * Get file size.
 *
 * @param {FileData} file
 */
export const getFileSize = (file: NodeFile | BrowserFile): number => {
  return (file as Buffer).length || (file as Blob).size
}

/**
 * Check if FileData is multipart data.
 *
 * @param {FileData} data
 * @param {number} multipartMinFileSize
 * @return {boolean}
 */
export const isMultipart = (
  data: NodeFile | BrowserFile,
  multipartMinFileSize: number
): boolean => {
  const fileSize = getFileSize(data)

  return fileSize >= multipartMinFileSize
}

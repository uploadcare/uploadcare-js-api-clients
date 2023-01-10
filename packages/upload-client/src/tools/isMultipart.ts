import defaultSettings from '../defaultSettings'

/**
 * Check if FileData is multipart data.
 */
export const isMultipart = (
  fileSize: number,
  multipartMinFileSize: number = defaultSettings.multipartMinFileSize
): boolean => {
  return fileSize >= multipartMinFileSize
}

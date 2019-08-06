import {FileData} from '../../types'
import {isNode} from '../../tools/isNode'

/**
 * Get file size.
 *
 * @param {FileData} file
 */
export const getFileSize = (file: FileData): number => {
  return isNode() ?
    (file as Buffer).length :
    (file as Blob).size
}

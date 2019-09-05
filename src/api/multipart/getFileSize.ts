import {isNode} from '../../tools/isNode'

/* Types */
import {FileData} from '../../types'

/**
 * Get file size.
 *
 * @param {FileData} file - File to get size.
 */
export const getFileSize = (file: FileData): number => {
  return isNode() ?
    (file as Buffer).length :
    (file as Blob).size
}

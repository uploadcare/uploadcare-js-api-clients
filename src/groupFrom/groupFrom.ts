import {FileData, Settings} from '../types'
import {Url} from '../api/fromUrl'
import {Uuid} from '../api/types'
import {GroupFrom} from './types'
import {GroupUploadInterface} from './types'
import {UploadGroupFromObject} from './UploadGroupFromObject'

/**
 * Uploads group of files from provided data
 *
 * @param {GroupFrom} from
 * @param {FileData[] | Url[] | Uuid[]} data
 * @param {Settings} settings
 */
export default function groupFrom(from: GroupFrom, data: Array<FileData> | Array<Url> | Array<Uuid>, settings: Settings = {}): GroupUploadInterface {
  switch (from) {
    case GroupFrom.Object:
      return new UploadGroupFromObject(data as Array<FileData>, settings)
    default:
      throw new Error(`Files group uploading from "${from}" is not supported`)
  }
}

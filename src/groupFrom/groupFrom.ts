import {FileData, Settings} from '../types'
import {Url} from '../api/fromUrl'
import {Uuid} from '../api/types'
import {GroupFrom} from './types'
import {GroupUploadInterface} from './types'
import fileFrom from '../fileFrom/fileFrom'
import group from '../api/group'
// import {UploadGroupFromObject} from './UploadGroupFromObject'

/**
 * Uploads group of files from provided data
 *
 * @param {GroupFrom} from
 * @param {FileData[] | Url[] | Uuid[]} data
 * @param {Settings} settings
 */
export default function groupFrom(from: GroupFrom, data: FileData[] | Url[] | Uuid[], settings: Settings = {}): GroupUploadInterface {


  switch (from) {
    case GroupFrom.Object:
      const promises = data.map(item => fileFrom(from, item as FileData, settings))

      return Promise.all(promises).then(files => {
        const uuids = files.map(file => file.uuid)
        return group(uuids, settings)
      })

      // return new UploadGroupFromObject(data as FileData[], settings)
    default:
      throw new Error(`Files group uploading from "${from}" is not supported`)
  }
}

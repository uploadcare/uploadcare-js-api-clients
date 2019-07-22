import {UploadFromObject} from './UploadFromObject'
import {UploadFromUrl} from './UploadFromUrl'
import {UploadFromUploaded} from './UploadFromUploaded'

/* Types */
import {FileData, Settings} from '../types'
import {Url} from '../api/fromUrl'
import {Uuid} from '../api/types'
import {GroupFrom, GroupUploadInterface} from './types'

/**
 * Uploads file from provided data.
 *
 * @param {FileFrom} from
 * @param {FileData} data
 * @param {Settings} settings
 * @throws Error
 * @returns {FileUploadInterface}
 */
export default function groupFrom(from: GroupFrom, data: FileData[] | Url[] | Uuid[], settings: Settings = {}): GroupUploadInterface {
  switch (from) {
    case GroupFrom.Object:
      return new UploadFromObject(data as FileData[], settings)
    case GroupFrom.URL:
      return new UploadFromUrl(data as Url[], settings)
    case GroupFrom.Uploaded:
      return new UploadFromUploaded(data as Uuid[], settings)
    default:
      throw new Error(`Group uploading from "${from}" is not supported`)
  }
}

import {UploadFromObject} from './UploadFromObject'
import {UploadFromUrl} from './UploadFromUrl'
import {UploadFromUploaded} from './UploadFromUploaded'

/* Types */
import {FileData, SettingsInterface} from '../types'
import {Url} from '../api/fromUrl'
import {Uuid} from '../api/types'
import {GroupFromEnum, GroupUploadInterface} from './types'

/**
 * Uploads file from provided data.
 *
 * @param {FileFromEnum} from
 * @param {FileData} data
 * @param {SettingsInterface} settings
 * @throws Error
 * @returns {FileUploadInterface}
 */
export default function groupFrom(from: GroupFromEnum, data: FileData[] | Url[] | Uuid[], settings: SettingsInterface = {}): GroupUploadInterface {
  switch (from) {
    case GroupFromEnum.Object:
      return new UploadFromObject(data as FileData[], settings)
    case GroupFromEnum.URL:
      return new UploadFromUrl(data as Url[], settings)
    case GroupFromEnum.Uploaded:
      return new UploadFromUploaded(data as Uuid[], settings)
    default:
      throw new TypeError(`Group uploading from "${from}" is not supported`)
  }
}

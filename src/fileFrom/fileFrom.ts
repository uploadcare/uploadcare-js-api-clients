import {UploadFromObject} from './UploadFromObject'
import {UploadFromUrl} from './UploadFromUrl'
import {UploadFromUploaded} from './UploadFromUploaded'

/* Types */
import {FileData, SettingsInterface} from '../types'
import {Url} from '../api/fromUrl'
import {Uuid} from '../api/types'
import {FileUploadInterface, FileFromEnum} from './types'

/**
 * Uploads file from provided data.
 *
 * @param {FileFromEnum} from
 * @param {FileData} data
 * @param {SettingsInterface} settings
 * @throws Error
 * @returns {FileUploadInterface}
 */
export default function fileFrom(from: FileFromEnum, data: FileData | Url | Uuid, settings: SettingsInterface = {}): FileUploadInterface {
  switch (from) {
    case FileFromEnum.Object:
      return new UploadFromObject(data as FileData, settings)
    case FileFromEnum.URL:
      return new UploadFromUrl(data as Url, settings)
    case FileFromEnum.Uploaded:
      return new UploadFromUploaded(data as Uuid, settings)
    default:
      throw new TypeError(`File uploading from "${from}" is not supported`)
  }
}

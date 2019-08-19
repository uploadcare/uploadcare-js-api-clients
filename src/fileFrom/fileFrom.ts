import {UploadFromObject} from './UploadFromObject'
import {UploadFromUrl} from './UploadFromUrl'
import {UploadFromUploaded} from './UploadFromUploaded'

/* Types */
import {FileData, SettingsInterface, UploadcareFileInterface} from '../types'
import {Url} from '../api/fromUrl'
import {Uuid} from '../api/types'
import {FileFromEnum} from './types'
import {UploadInterface} from '../lifecycle/types'

/**
 * Uploads file from provided data.
 *
 * @param {FileFromEnum} from
 * @param {FileData} data
 * @param {SettingsInterface} settings
 * @throws Error
 * @returns {UploadInterface<UploadcareFileInterface>}
 */
export default function fileFrom(from: FileFromEnum, data: FileData | Url | Uuid, settings: SettingsInterface = {}): UploadInterface<UploadcareFileInterface> {
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

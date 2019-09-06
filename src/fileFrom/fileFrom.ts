import {UploadFromObject} from './UploadFromObject'
import {UploadFromUrl} from './UploadFromUrl'
import {UploadFromUploaded} from './UploadFromUploaded'

/* Types */
import {FileData, SettingsInterface, UploadcareFileInterface, UploadFromEnum} from '../types'
import {Url} from '../api/fromUrl'
import {Uuid} from '../api/types'
import {UploadInterface} from '../lifecycle/types'

/**
 * Uploads file from provided data.
 *
 * @param {UploadFromEnum} from - Method of uploading.
 * @param {FileData} data - Data to upload.
 * @param {SettingsInterface} settings - Client settings.
 * @throws TypeError
 * @returns {UploadInterface<UploadcareFileInterface>}
 */
export default function fileFrom(
  from: UploadFromEnum, data: FileData | Url | Uuid, settings: SettingsInterface = {}
): UploadInterface<UploadcareFileInterface> {
  switch (from) {
    case UploadFromEnum.Object:
      return new UploadFromObject(data as FileData, settings)
    case UploadFromEnum.URL:
      return new UploadFromUrl(data as Url, settings)
    case UploadFromEnum.Uploaded:
      return new UploadFromUploaded(data as Uuid, settings)
    default:
      throw new TypeError(`File uploading from "${from}" is not supported`)
  }
}

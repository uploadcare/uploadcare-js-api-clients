import {UploadFromObject} from './UploadFromObject'
import {UploadFromUrl} from './UploadFromUrl'
import {UploadFromUploaded} from './UploadFromUploaded'

/* Types */
import {FileData, SettingsInterface} from '../types'
import {Url} from '../api/fromUrl'
import {Uuid} from '../api/types'
import {GroupUploadInterface, isFileDataArray, isUrlArray, isUuidArray} from './types'

/**
 * Uploads file from provided data.
 *
 * @param {FileData} data
 * @param {SettingsInterface} settings
 * @throws Error
 * @returns {UploadInterface<UploadcareGroupInterface>}
 */
export default function groupFrom(data: FileData[] | Url[] | Uuid[], settings: SettingsInterface = {}): GroupUploadInterface {
  if (isFileDataArray(data)) {
    return new UploadFromObject(data, settings)
  }

  if (isUrlArray(data)) {
    return new UploadFromUrl(data, settings)
  }

  if (isUuidArray(data)) {
    return new UploadFromUploaded(data, settings)
  }

  throw new TypeError(`Group uploading from "${data}" is not supported`)
}

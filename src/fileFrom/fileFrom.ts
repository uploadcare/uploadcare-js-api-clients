import {FileData, Settings, UploadcareFile} from '../types'
import {Url} from '../api/fromUrl'
import {Uuid} from '../api/types'
import {UploadFromObject} from './UploadFromObject'
import {UploadFromUrl} from './UploadFromUrl'
import {UploadFromUploaded} from './UploadFromUploaded'
import {FileUploadInterface, FileFrom} from './types'
import {UploadLifecycle} from '../lifecycle/UploadLifecycle'
import {FileUploadLifecycle} from '../lifecycle/FileUploadLifecycle'

/**
 * Uploads file from provided data
 *
 * @param {FileFrom} from
 * @param {FileData} data
 * @param {Settings} settings
 * @throws Error
 * @returns {FileUploadInterface}
 */
export default function fileFrom(from: FileFrom, data: FileData | Url | Uuid, settings: Settings = {}): FileUploadInterface {
  const uploadLifecycle = new UploadLifecycle<UploadcareFile>()
  const uploadFileLifecycle = new FileUploadLifecycle(uploadLifecycle)

  switch (from) {
    case FileFrom.Object:
      return new UploadFromObject(uploadFileLifecycle, data as FileData, settings)
    case FileFrom.URL:
      return new UploadFromUrl(data as Url, settings)
    case FileFrom.Uploaded:
      return new UploadFromUploaded(data as Uuid, settings)
    default:
      throw new Error(`File uploading from "${from}" is not supported`)
  }
}

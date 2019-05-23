import {FileData, Settings} from '../types'
import {Url} from '../api/fromUrl'
import {Uuid} from '../api/info'
import {UploadFromObject} from './UploadFromObject'
import {UploadFromUrl} from './UploadFromUrl'
import {UploadFromInterface} from './UploadFrom'
import {UploadFromUploaded} from './UploadFromUploaded'

export enum FileFrom {
  Object = 'object',
  URL = 'url',
  DOM = 'input',
  Uploaded = 'uploaded',
}

/**
 * Uploads file from provided data
 *
 * @param {FileFrom} from
 * @param {FileData} data
 * @param {Settings} settings
 * @throws Error
 * @returns {UploadFromInterface}
 */
export default function fileFrom(from: FileFrom, data: FileData | Url | Uuid, settings: Settings = {}): UploadFromInterface {
  switch (from) {
    case FileFrom.Object:
      return new UploadFromObject(data as FileData, settings)
    case FileFrom.URL:
      return new UploadFromUrl(data as Url, settings)
    case FileFrom.Uploaded:
      return new UploadFromUploaded(data as Uuid, settings)
    default:
      throw new Error(`File uploading from "${from}" is not supported`)
  }
}

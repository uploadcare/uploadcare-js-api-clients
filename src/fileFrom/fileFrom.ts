import {FileData, Settings} from '../types'
import {UrlData} from '../api/fromUrl'
import {UploadFromObject} from './UploadFromObject'
import {UploadFromUrl} from './UploadFromUrl'
import {UploadFromInterface} from './UploadFrom'

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
export default function fileFrom(from: FileFrom, data: FileData | UrlData, settings: Settings = {}): UploadFromInterface {
  switch (from) {
    case FileFrom.Object:
      return new UploadFromObject(data as FileData, settings)
    case FileFrom.URL:
      return new UploadFromUrl(data as UrlData, settings)
    default:
      throw new Error(`File uploading from "${from}" is not supported`)
  }
}

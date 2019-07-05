import {FileData, Settings, UploadcareFileInterface} from '../types'
import {Url} from '../api/fromUrl'
import {Uuid} from '../api/types'
import {UploadFromObject} from './UploadFromObject'
import {UploadFromUrl} from './UploadFromUrl'
import {UploadFromUploaded} from './UploadFromUploaded'
import {FileUploadInterface, FileFrom} from './types'
import {UploadLifecycle} from '../lifecycle/UploadLifecycle'
import {FileUploadLifecycle} from '../lifecycle/FileUploadLifecycle'
import base from '../api/base'
import {ObjectFileHandler} from './object/ObjectFileHandler'
import {ObjectFileCancelHandler} from './object/ObjectFileCancelHandler'
import {FileUpload} from './FileUpload'
import {fileFromObject} from './object'
import {ObjectFileUpload} from './object/ObjectFileUpload'

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
  switch (from) {
    case FileFrom.Object:
      const lifecycle = new UploadLifecycle<UploadcareFileInterface>()
      const fileUploadLifecycle = new FileUploadLifecycle(lifecycle)
      //
      // return new ObjectFileUpload(data as FileData, settings, fileUploadLifecycle)
      return new UploadFromObject(fileUploadLifecycle, data as FileData, settings)
    case FileFrom.URL:
      return new UploadFromUrl(data as Url, settings)
    case FileFrom.Uploaded:
      return new UploadFromUploaded(data as Uuid, settings)
    default:
      throw new Error(`File uploading from "${from}" is not supported`)
  }
}

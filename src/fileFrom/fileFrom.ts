import {UploadLifecycle} from '../lifecycle/UploadLifecycle'
import {FileUploadLifecycle} from '../lifecycle/FileUploadLifecycle'
import {FileFromObject} from './FileFromObject'
import {FileFromUploaded} from './FileFromUploaded'
import {FileFromUrl} from './FileFromUrl'

/* Types */
import {FileData, SettingsInterface, UploadcareFileInterface} from '../types'
import {Url} from '../api/fromUrl'
import {Uuid} from '../api/types'
import {FileUploadLifecycleInterface, UploadInterface} from '../lifecycle/types'
import {isFileData, isUrl, isUuid} from './types'
import {Upload} from '../lifecycle/Upload'
import {createProxyHandler} from '../lifecycle/createProxyHandler'

/**
 * Uploads file from provided data.
 *
 * @param {FileData | Url | Uuid} data
 * @param {SettingsInterface} settings
 * @throws TypeError
 * @returns {UploadInterface<UploadcareFileInterface>}
 */
export default function fileFrom(data: FileData | Url | Uuid, settings: SettingsInterface = {}): UploadInterface<UploadcareFileInterface> {
  const lifecycle = new UploadLifecycle<UploadcareFileInterface>()
  const fileUploadLifecycle = new FileUploadLifecycle(lifecycle)
  const lifecycleProxyHandler = createProxyHandler<UploadcareFileInterface>(lifecycle)

  if (isFileData(data)) {
    const fileHandler = new FileFromObject(data, settings)
    const fileUpload = new Upload<UploadcareFileInterface, FileUploadLifecycleInterface>(fileUploadLifecycle, fileHandler)

    return new Proxy(fileUpload, lifecycleProxyHandler)
  }

  if (isUrl(data)) {
    const fileHandler = new FileFromUrl(data, settings)
    const fileUpload = new Upload<UploadcareFileInterface, FileUploadLifecycleInterface>(fileUploadLifecycle, fileHandler)

    return new Proxy(fileUpload, lifecycleProxyHandler)
  }

  if (isUuid(data)) {
    const fileHandler = new FileFromUploaded(data, settings)
    const fileUpload = new Upload<UploadcareFileInterface, FileUploadLifecycleInterface>(fileUploadLifecycle, fileHandler)

    return new Proxy(fileUpload, lifecycleProxyHandler)
  }

  throw new TypeError(`File uploading from "${data}" is not supported`)
}

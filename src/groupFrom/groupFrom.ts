import {GroupUploadLifecycle} from '../lifecycle/GroupUploadLifecycle'
import {UploadLifecycle} from '../lifecycle/UploadLifecycle'
import {GroupFromObject} from './GroupFromObject'
import {GroupFromUploaded} from './GroupFromUploaded'
import {GroupFromUrl} from './GroupFromUrl'

/* Types */
import {FileData, SettingsInterface, UploadcareGroupInterface} from '../types'
import {Url} from '../api/fromUrl'
import {Uuid} from '../api/types'
import {isFileDataArray, isUrlArray, isUuidArray} from './types'
import {GroupUploadLifecycleInterface, UploadInterface} from '../lifecycle/types'
import {Upload} from '../lifecycle/Upload'
import {createProxyHandler} from '../lifecycle/createProxyHandler'

/**
 * Uploads file from provided data.
 *
 * @param {FileData} data
 * @param {SettingsInterface} settings
 * @throws Error
 * @returns {UploadInterface<UploadcareGroupInterface>}
 */
export default function groupFrom(data: FileData[] | Url[] | Uuid[], settings: SettingsInterface = {}): UploadInterface<UploadcareGroupInterface> {
  const lifecycle = new UploadLifecycle<UploadcareGroupInterface>()
  const groupUploadLifecycle = new GroupUploadLifecycle(lifecycle)
  const lifecycleProxyHandler = createProxyHandler<UploadcareGroupInterface>(lifecycle)

  if (isFileDataArray(data)) {
    const fileHandler = new GroupFromObject(data, settings)
    const fileUpload = new Upload<UploadcareGroupInterface, GroupUploadLifecycleInterface>(groupUploadLifecycle, fileHandler)

    return new Proxy(fileUpload, lifecycleProxyHandler)
  }

  if (isUrlArray(data)) {
    const fileHandler = new GroupFromUrl(data, settings)
    const fileUpload = new Upload<UploadcareGroupInterface, GroupUploadLifecycleInterface>(groupUploadLifecycle, fileHandler)

    return new Proxy(fileUpload, lifecycleProxyHandler)
  }

  if (isUuidArray(data)) {
    const fileHandler = new GroupFromUploaded(data, settings)
    const fileUpload = new Upload<UploadcareGroupInterface, GroupUploadLifecycleInterface>(groupUploadLifecycle, fileHandler)

    return new Proxy(fileUpload, lifecycleProxyHandler)
  }

  throw new TypeError(`Group uploading from "${data}" is not supported`)
}

import {GroupUploadLifecycle} from '../lifecycle/GroupUploadLifecycle'
import {UploadLifecycle} from '../lifecycle/UploadLifecycle'
import {UploadGroup} from '../lifecycle/UploadGroup'
import {GroupFromObject} from './GroupFromObject'
import {GroupFromUploaded} from './GroupFromUploaded'
import {GroupFromUrl} from './GroupFromUrl'

/* Types */
import {FileData, SettingsInterface, UploadcareGroupInterface} from '../types'
import {Url} from '../api/fromUrl'
import {Uuid} from '../api/types'
import {GroupUploadInterface, isFileDataArray, isUrlArray, isUuidArray} from './types'
import {LifecycleInterface, UploadInterface} from '../lifecycle/types'

const createProxyHandler = (lifecycle: LifecycleInterface<UploadcareGroupInterface>): ProxyHandler<UploadInterface<UploadcareGroupInterface>> => {
  return {
    set: (target, propertyKey, newValue): boolean => {
      if (propertyKey === 'onProgress'
        || propertyKey === 'onUploaded'
        || propertyKey === 'onReady'
        || propertyKey === 'onCancel') {
        // update object property
        target[propertyKey] = newValue

        // and update uploadLifecycle property
        lifecycle[propertyKey] = newValue
        return true
      } else {
        return false
      }
    }
  }
}

/**
 * Uploads file from provided data.
 *
 * @param {FileData} data
 * @param {SettingsInterface} settings
 * @throws Error
 * @returns {UploadInterface<UploadcareGroupInterface>}
 */
export default function groupFrom(data: FileData[] | Url[] | Uuid[], settings: SettingsInterface = {}): GroupUploadInterface {
  const lifecycle = new UploadLifecycle<UploadcareGroupInterface>()
  const groupUploadLifecycle = new GroupUploadLifecycle(lifecycle)
  const lifecycleProxyHandler = createProxyHandler(lifecycle)

  if (isFileDataArray(data)) {
    const fileHandler = new GroupFromObject(data, settings)
    const fileUpload = new UploadGroup(groupUploadLifecycle, fileHandler)

    return new Proxy(fileUpload, lifecycleProxyHandler)
  }

  if (isUrlArray(data)) {
    const fileHandler = new GroupFromUrl(data, settings)
    const fileUpload = new UploadGroup(groupUploadLifecycle, fileHandler)

    return new Proxy(fileUpload, lifecycleProxyHandler)
  }

  if (isUuidArray(data)) {
    const fileHandler = new GroupFromUploaded(data, settings)
    const fileUpload = new UploadGroup(groupUploadLifecycle, fileHandler)

    return new Proxy(fileUpload, lifecycleProxyHandler)
  }

  throw new TypeError(`Group uploading from "${data}" is not supported`)
}

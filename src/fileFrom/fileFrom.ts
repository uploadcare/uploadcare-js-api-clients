import {isNode} from '../tools/isNode'
import {UploadLifecycle} from '../lifecycle/UploadLifecycle'
import {FromObjectFileHandler} from './FromObjectFileHandler'
import {FromUploadedFileHandler} from './FromUploadedFileHandler'
import {FileUploadLifecycle} from '../lifecycle/FileUploadLifecycle'
import {FileUpload} from './FileUpload'

/* Types */
import {FileData, SettingsInterface, UploadcareFileInterface} from '../types'
import {Url} from '../api/fromUrl'
import {Uuid} from '../api/types'
import {LifecycleInterface, UploadInterface} from '../lifecycle/types'
import {FromUrlFileHandler} from './FromUrlFileHandler'

/**
 * FileData type guard.
 *
 * @param {FileData | Url | Uuid} data
 */
export const isFileData = (data: FileData | Url | Uuid): data is FileData => {
  return data !== undefined &&
    (
      (!isNode() && data instanceof Blob) ||
      (!isNode() && data instanceof File) ||
      (isNode() && data instanceof Buffer)
    )
}

/**
 * Uuid type guard.
 *
 * @param {FileData | Url | Uuid} data
 */
export const isUuid = (data: FileData | Url | Uuid): data is Uuid => {
  const UUID_REGEX = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'
  const regExp = (new RegExp(UUID_REGEX))

  return !isFileData(data) &&
    regExp.test(data)
}

/**
 * Url type guard.
 *
 * @param {FileData | Url | Uuid} data
 */
export const isUrl = (data: FileData | Url | Uuid): data is Url => {
  const URL_REGEX = '^(?:\\w+:)?\\/\\/([^\\s\\.]+\\.\\S{2}|localhost[\\:?\\d]*)\\S*$'
  const regExp = (new RegExp(URL_REGEX))

  return !isFileData(data) &&
    regExp.test(data)
}

const createProxyHandler = (lifecycle: LifecycleInterface<UploadcareFileInterface>): ProxyHandler<UploadInterface<UploadcareFileInterface>> => {
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
 * @param {FileData | Url | Uuid} data
 * @param {SettingsInterface} settings
 * @throws TypeError
 * @returns {UploadInterface<UploadcareFileInterface>}
 */
export default function fileFrom(data: FileData | Url | Uuid, settings: SettingsInterface = {}): UploadInterface<UploadcareFileInterface> {
  const lifecycle = new UploadLifecycle<UploadcareFileInterface>()
  const fileUploadLifecycle = new FileUploadLifecycle(lifecycle)
  const lifecycleProxyHandler = createProxyHandler(lifecycle)

  if (isFileData(data)) {
    const fileHandler = new FromObjectFileHandler(data, settings)
    const fileUpload = new FileUpload(fileUploadLifecycle, fileHandler)

    return new Proxy(fileUpload, lifecycleProxyHandler)
  }

  if (isUrl(data)) {
    const fileHandler = new FromUrlFileHandler(data, settings)
    const fileUpload = new FileUpload(fileUploadLifecycle, fileHandler)

    return new Proxy(fileUpload, lifecycleProxyHandler)
  }

  if (isUuid(data)) {
    const fileHandler = new FromUploadedFileHandler(data, settings)
    const fileUpload = new FileUpload(fileUploadLifecycle, fileHandler)

    return new Proxy(fileUpload, lifecycleProxyHandler)
  }

  throw new TypeError(`File uploading from "${data}" is not supported`)
}

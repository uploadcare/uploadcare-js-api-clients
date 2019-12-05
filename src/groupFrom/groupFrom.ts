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
import {
  GroupUploadLifecycleInterface,
  LifecycleHooksInterface,
  UploadInterface
} from '../lifecycle/types'
import {Upload} from '../lifecycle/Upload'

/**
 * Uploads file from provided data.
 *
 * @param {FileData} data
 * @param {SettingsInterface} settings
 * @param {LifecycleHooksInterface<UploadcareGroupInterface>} hooks
 * @throws TypeError
 * @returns {UploadInterface<UploadcareGroupInterface>}
 */
export default function groupFrom(
  data: FileData[] | Url[] | Uuid[],
  settings: SettingsInterface = {},
  hooks?: LifecycleHooksInterface<UploadcareGroupInterface>,
): UploadInterface<UploadcareGroupInterface> {
  const lifecycle = new UploadLifecycle<UploadcareGroupInterface>(hooks)
  const groupUploadLifecycle = new GroupUploadLifecycle(lifecycle)

  if (isFileDataArray(data)) {
    const fileHandler = new GroupFromObject(data, settings)

    return new Upload<UploadcareGroupInterface, GroupUploadLifecycleInterface>(groupUploadLifecycle, fileHandler)
  }

  if (isUrlArray(data)) {
    const fileHandler = new GroupFromUrl(data, settings)

    return new Upload<UploadcareGroupInterface, GroupUploadLifecycleInterface>(groupUploadLifecycle, fileHandler)
  }

  if (isUuidArray(data)) {
    const fileHandler = new GroupFromUploaded(data, settings)

    return new Upload<UploadcareGroupInterface, GroupUploadLifecycleInterface>(groupUploadLifecycle, fileHandler)
  }

  throw new TypeError(`Group uploading from "${data}" is not supported`)
}

import {FileData, Settings, UploadcareGroupInterface} from '../types'
import {Url} from '../api/fromUrl'
import {Uuid} from '../api/types'
import {GroupFrom} from './types'
import {GroupUploadInterface} from './types'
import {GroupUpload} from './GroupUpload'
import {GroupUploadLifecycle} from '../lifecycle/GroupUploadLifecycle'
import {UploadLifecycle} from '../lifecycle/UploadLifecycle'
import {ObjectFilesGroupUploadHandler} from './ObjectFilesGroupUploadHandler'
import {GroupCancelHandler} from './GroupCancelHandler'
import {UrlFilesGroupUploadHandler} from './UrlFilesGroupUploadHandler'
import {UploadedFilesGroupUploadHandler} from './UploadedFilesGroupUploadHandler'

/**
 * Uploads group of files from provided data
 *
 * @param {GroupFrom} from
 * @param {FileData[] | Url[] | Uuid[]} data
 * @param {Settings} settings
 */
export default function groupFrom(from: GroupFrom, data: FileData[] | Url[] | Uuid[], settings: Settings = {}): GroupUploadInterface {
  const lifecycle = new UploadLifecycle<UploadcareGroupInterface>()
  const groupUploadLifecycle = new GroupUploadLifecycle(lifecycle)
  const groupCancelUpload = new GroupCancelHandler()

  let groupUploadHandler

  switch (from) {
    case GroupFrom.Object:
      groupUploadHandler = new ObjectFilesGroupUploadHandler(from, data as FileData[], settings)
      break
    case GroupFrom.URL:
      groupUploadHandler = new UrlFilesGroupUploadHandler(from, data as Url[], settings)
      break
    case GroupFrom.Uploaded:
      groupUploadHandler = new UploadedFilesGroupUploadHandler(from, data as Uuid[], settings)
      break
    default:
      throw new Error(`Group uploading from "${from}" is not supported`)
  }

  return new GroupUpload(groupUploadLifecycle, groupUploadHandler, groupCancelUpload)
}

import {UploadLifecycle} from '../../lifecycle/UploadLifecycle'
import {FileData, Settings, UploadcareFileInterface} from '../../types'
import {FileUploadLifecycle} from '../../lifecycle/FileUploadLifecycle'
import base from '../../api/base'
import {ObjectFileHandler} from './ObjectFileHandler'
import {ObjectFileCancelHandler} from './ObjectFileCancelHandler'
import {FileUpload} from '../FileUpload'
import {FileUploadInterface} from '../types'

export const fileFromObject = (data: FileData, settings: Settings): FileUploadInterface => {
  const lifecycle = new UploadLifecycle<UploadcareFileInterface>()
  const fileUploadLifecycle = new FileUploadLifecycle(lifecycle)

  const request = base(data, settings)

  const handler = new ObjectFileHandler(request, fileUploadLifecycle, settings)
  const cancelable = new ObjectFileCancelHandler(request)

  return new FileUpload(fileUploadLifecycle, handler, cancelable)
}

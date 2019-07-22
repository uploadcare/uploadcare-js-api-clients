import multipartStart from './multipartStart'
import multipartUpload from './multipartUpload'
import multipartComplete from './multipartComplete'
import {Thenable} from '../../tools/Thenable'

/* Types */
import {MultipartCompleteResponse, MultipartInterface, MultipartUploadInterface} from './types'
import {FileData, ProgressState, Settings, UploadingProgress} from '../../types'
import {HandleProgressFunction} from '../request/types'
import {Uuid} from '../types'

/**
 * Upload parts.
 *
 * @param {FileData} file
 * @param {Settings} settings
 */
const upload = async (file: FileData, settings: Settings) => {
  const {uuid, parts} = await multipartStart(file, settings)

  return multipartUpload(file, parts, settings).then(() => Promise.resolve(uuid))
}

class Multipart extends Thenable<MultipartCompleteResponse> implements MultipartInterface {
  onCancel: VoidFunction | null = null
  onProgress: HandleProgressFunction | null = null

  protected readonly promise: Promise<MultipartCompleteResponse>

  constructor(file: FileData, settings: Settings) {
    super()
    this.promise = upload(file, settings)
      .then((uuid: Uuid) => multipartComplete(uuid, settings))
  }

  cancel(): void {
  }
}

/**
 * Upload multipart file.
 *
 * @param {FileData} file
 * @param {Settings} settings
 * @return {MultipartUploadInterface}
 */
export default function multipart(file: FileData, settings: Settings = {}): MultipartInterface {
  return new Multipart(file, settings)
}

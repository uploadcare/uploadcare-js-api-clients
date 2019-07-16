import request, {DEFAULT_FILE_NAME, DEFAULT_PART_SIZE, prepareOptions, RequestOptions} from './request'
import {FileData, Settings} from '../types'
import {Uuid} from './types'

export type MultipartStartResponse = {
  parts: string[],
  uuid: Uuid,
}

const getRequestBody = (file: FileData, settings: Settings) => ({
  filename: settings.fileName || DEFAULT_FILE_NAME,
  size: settings.multipartPartSize || DEFAULT_PART_SIZE,
  content_type: 'application/octet-stream',
  UPLOADCARE_STORE: settings.doNotStore ? '' : 'auto',
  UPLOADCARE_PUB_KEY: settings.publicKey || '',
  signature: settings.secureSignature || '',
  expire: settings.secureExpire || '',
  source: 'local'
})

const getRequestOptions = (file: FileData, settings: Settings): RequestOptions => {
  return prepareOptions({
    method: 'POST',
    path: '/multipart/start/',
    body: getRequestBody(file, settings),
  }, settings)
}

// export type MultipartCompleteResponse = FileInfo
//
// export interface MultipartUploadInterface extends Promise<MultipartCompleteResponse>, CancelableInterface {
//   onProgress: VoidFunction | null
//   onCancel: VoidFunction | null
// }

/**
 * Start multipart uploading.
 * @param {FileData} file
 * @param {Settings} settings
 * @return {Promise<MultipartStartResponse>}
 */
export default function multipartStart(file: FileData, settings: Settings = {}): Promise<MultipartStartResponse> {
  const options = getRequestOptions(file, settings)

  return request(options)
    .then(response => response.data)
}

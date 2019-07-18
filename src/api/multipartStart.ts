import request, {DEFAULT_FILE_NAME, DEFAULT_PART_SIZE} from './request/request'
import {prepareOptions} from './request/prepareOptions'
import {RequestOptions} from './request/types'
import {FileData, Settings} from '../types'
import {Uuid} from './types'
import {isNode} from '../tools/isNode'

export type MultipartPart = string

export type MultipartStartResponse = {
  parts: MultipartPart[],
  uuid: Uuid,
}

const getFileSize = (file: FileData): number => {
  return isNode() ?
    (file as Buffer).length :
    (file as Blob).size
}

const getRequestBody = (file: FileData, settings: Settings) => {
  const size: number = getFileSize(file)

  return {
    filename: settings.fileName || DEFAULT_FILE_NAME,
    size,
    partSize: settings.multipartPartSize || DEFAULT_PART_SIZE,
    content_type: 'application/octet-stream',
    UPLOADCARE_STORE: settings.doNotStore ? '' : 'auto',
    UPLOADCARE_PUB_KEY: settings.publicKey || '',
    signature: settings.secureSignature || '',
    expire: settings.secureExpire || '',
    source: 'local'
  }
}

const getRequestOptions = (file: FileData, settings: Settings): RequestOptions => {
  return prepareOptions({
    method: 'POST',
    path: '/multipart/start/',
    body: getRequestBody(file, settings),
  }, settings)
}

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

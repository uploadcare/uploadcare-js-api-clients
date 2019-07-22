import request from '../request/request'
import {prepareOptions} from '../request/prepareOptions'
import {getFileSize} from './getFileSize'
import defaultSettings from '../../defaultSettings'

/* Types */
import {RequestOptions} from '../request/types'
import {FileData, Settings} from '../../types'
import {MultipartStartResponse} from './types'

const getRequestBody = (file: FileData, settings: Settings) => {
  const size: number = getFileSize(file)

  return {
    filename: settings.fileName || defaultSettings.fileName,
    size,
    partSize: settings.multipartChunkSize || defaultSettings.multipartChunkSize,
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
 *
 * @param {FileData} file
 * @param {Settings} settings
 * @return {Promise<MultipartStartResponse>}
 */
export default function multipartStart(file: FileData, settings: Settings = {}): Promise<MultipartStartResponse> {
  const options = getRequestOptions(file, settings)

  return request(options)
    .then(response => response.data)
}

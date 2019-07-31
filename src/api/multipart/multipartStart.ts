import {prepareOptions} from '../request/prepareOptions'
import {getFileSize} from './getFileSize'
import defaultSettings from '../../defaultSettings'

/* Types */
import {RequestOptions} from '../request/types'
import {FileData, Settings} from '../../types'
import {MultipartStartResponse} from './types'
import {CancelableThenableInterface} from '../../thenable/types'
import {CancelableThenable} from '../../thenable/CancelableThenable'

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
 * @return {CancelableThenableInterface<MultipartStartResponse>}
 */
export default function multipartStart(file: FileData, settings: Settings = {}): CancelableThenableInterface<MultipartStartResponse> {
  const options = getRequestOptions(file, settings)

  return new CancelableThenable<MultipartStartResponse>(options)
}
import {prepareOptions} from './request/prepareOptions'

/* Types */
import {RequestOptions} from './request/types'
import {Settings, FileData} from '../types'
import {BaseResponse} from './types'
import {UploadThenableInterface} from '../thenable/types'
import {UploadThenable} from '../thenable/UploadThenable'

const getRequestBody = (file: FileData, settings: Settings) => ({
  UPLOADCARE_PUB_KEY: settings.publicKey || '',
  signature: settings.secureSignature || '',
  expire: settings.secureExpire || '',
  UPLOADCARE_STORE: settings.doNotStore ? '' : 'auto',
  source: settings.source || 'local',
  file: file,
})

const getRequestOptions = (file: FileData, settings: Settings): RequestOptions => {
  return prepareOptions({
    method: 'POST',
    path: '/base/',
    body: getRequestBody(file, settings),
  }, settings)
}

/**
 * Performs file uploading request to Uploadcare Upload API.
 * Can be canceled and has progress.
 *
 * @param {FileData} file
 * @param {Settings} settings
 * @return {UploadThenableInterface<BaseResponse>}
 */
export default function base(file: FileData, settings: Settings = {}): UploadThenableInterface<BaseResponse> {
  const options = getRequestOptions(file, settings)

  return new UploadThenable<BaseResponse>(options)
}

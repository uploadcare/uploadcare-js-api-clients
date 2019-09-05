import {prepareOptions} from './request/prepareOptions'

/* Types */
import {Body, RequestOptionsInterface} from './request/types'
import {SettingsInterface, FileData} from '../types'
import {Uuid} from './types'
import {BaseThenableInterface} from '../thenable/types'
import {BaseThenable} from '../thenable/BaseThenable'

export type BaseResponse = {
  file: Uuid;
}

const getRequestBody = (file: FileData, settings: SettingsInterface): Body => ({
  UPLOADCARE_PUB_KEY: settings.publicKey || '',
  signature: settings.secureSignature || '',
  expire: settings.secureExpire || '',
  UPLOADCARE_STORE: settings.doNotStore ? '' : 'auto',
  source: settings.source || 'local',
  file: file,
})

const getRequestOptions = (file: FileData, settings: SettingsInterface): RequestOptionsInterface => {
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
 * @param {FileData} file - File to upload.
 * @param {SettingsInterface} settings - Client settings.
 * @return {BaseThenableInterface<BaseResponse>}
 */
export default function base(file: FileData, settings: SettingsInterface = {}): BaseThenableInterface<BaseResponse> {
  const options = getRequestOptions(file, settings)

  return new BaseThenable<BaseResponse>(options)
}

import {prepareOptions} from '../request/prepareOptions'

/* Types */
import {RequestOptions} from '../request/types'
import {Settings} from '../../types'
import {Uuid} from '../types'
import {MultipartCompleteResponse} from './types'
import {CancelableThenableInterface} from '../../thenable/types'
import {CancelableThenable} from '../../thenable/CancelableThenable'

const getRequestBody = (uuid: Uuid, settings: Settings) => ({
  uuid,
  UPLOADCARE_PUB_KEY: settings.publicKey || '',
  source: settings.source || 'local',
})

const getRequestOptions = (uuid: Uuid, settings: Settings): RequestOptions => {
  return prepareOptions({
    method: 'POST',
    path: '/multipart/complete/',
    body: getRequestBody(uuid, settings),
  }, settings)
}

/**
 * Complete multipart uploading.
 *
 * @param {Uuid} uuid
 * @param {Settings} settings
 * @return {CancelableThenableInterface<MultipartCompleteResponse>}
 */
export default function multipartComplete(uuid: Uuid, settings: Settings = {}): CancelableThenableInterface<MultipartCompleteResponse> {
  const options = getRequestOptions(uuid, settings)

  return new CancelableThenable<MultipartCompleteResponse>(options)
}

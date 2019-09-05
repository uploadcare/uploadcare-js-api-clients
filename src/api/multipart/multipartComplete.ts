import {prepareOptions} from '../request/prepareOptions'

/* Types */
import {Body, RequestOptionsInterface} from '../request/types'
import {SettingsInterface} from '../../types'
import {FileInfoInterface, Uuid} from '../types'
import {CancelableThenableInterface} from '../../thenable/types'
import {CancelableThenable} from '../../thenable/CancelableThenable'

const getRequestBody = (uuid: Uuid, settings: SettingsInterface): Body => ({
  uuid,
  UPLOADCARE_PUB_KEY: settings.publicKey || '',
  source: settings.source || 'local',
})

const getRequestOptions = (uuid: Uuid, settings: SettingsInterface): RequestOptionsInterface => {
  return prepareOptions({
    method: 'POST',
    path: '/multipart/complete/',
    body: getRequestBody(uuid, settings),
  }, settings)
}

/**
 * Complete multipart uploading.
 *
 * @param {Uuid} uuid - File UUID.
 * @param {SettingsInterface} settings - Client settings.
 * @return {CancelableThenableInterface<FileInfoInterface>}
 */
export default function multipartComplete(uuid: Uuid, settings: SettingsInterface = {}): CancelableThenableInterface<FileInfoInterface> {
  const options = getRequestOptions(uuid, settings)

  return new CancelableThenable<FileInfoInterface>(options)
}

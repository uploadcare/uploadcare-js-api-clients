import multipartComplete from '../../src/api/multipartComplete'
import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'

describe('API - multipartComplete', () => {
  const completeUuid = ''

  it('should be able to start upload data', async() => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
    })



    const multipartCompleteUpload = multipartComplete(completeUuid, settings)
    const {uuid} = await multipartCompleteUpload

    expect(uuid).toBeTruthy()
  })

  it('should be rejected with bad options', (done) => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
    })

    multipartComplete('', settings)
      .then(() => done.fail('Promise should not to be resolved'))
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })
})

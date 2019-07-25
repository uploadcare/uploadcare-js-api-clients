import multipartStart from '../../../src/api/multipart/multipartStart'
import * as factory from '../../_fixtureFactory'
import {getSettingsForTesting} from '../../_helpers'

describe('API - multipartStart', () => {
  it('should be able to start upload data', async() => {
    const fileToUpload = factory.file(11).data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
    })
    const multipartStartUpload = multipartStart(fileToUpload, settings)
    const {uuid, parts} = await multipartStartUpload

    expect(uuid).toBeTruthy()
    expect(parts).toBeTruthy()
  })

  it('should be rejected with bad options', (done) => {
    const fileToUpload = factory.file(9).data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
    })

    multipartStart(fileToUpload, settings)
      .then(() => done.fail('Promise should not to be resolved'))
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })
})

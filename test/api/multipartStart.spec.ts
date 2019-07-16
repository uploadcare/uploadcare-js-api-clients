import multipartStart from '../../src/api/multipartStart'
import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'

describe('API - multipartStart', () => {
  it('should be able to start upload data', async() => {
    const fileToUpload = factory.file(11)
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
    })
    const multipartStartUpload = multipartStart(fileToUpload.data, settings)
    const {uuid, parts} = await multipartStartUpload

    expect(uuid).toBeTruthy()
    expect(parts).toBeTruthy()
  })

  it('should be rejected with bad options', (done) => {
    const fileToUpload = factory.file(9)
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
    })

    multipartStart(fileToUpload.data, settings)
      .then(() => done.fail('Promise should not to be resolved'))
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })
})

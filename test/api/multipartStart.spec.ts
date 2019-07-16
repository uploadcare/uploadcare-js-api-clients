import multipartStart from '../../src/api/multipartStart'
import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'

fdescribe('API - multipartStart', () => {
  const fileToUpload = factory.image('blackSquare')

  it('should be able to start upload data', async() => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
      multipartPartSize: 10585760,
    })
    const multipartStartUpload = multipartStart(fileToUpload.data, settings)
    const {uuid, parts} = await multipartStartUpload

    expect(uuid).toBeTruthy()
    expect(parts).toBeTruthy()
  })

  it('should be rejected with bad options', (done) => {
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

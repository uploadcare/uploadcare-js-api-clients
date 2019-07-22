import * as factory from '../../_fixtureFactory'
import multipartUpload from '../../../src/api/multipart/multipartUpload'
import {getSettingsForTesting} from '../../_helpers'
import multipartStart from '../../../src/api/multipart/multipartStart'

fdescribe('API - multipartUpload', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000
  const fileToUpload = factory.file(11).data

  it('should be able to upload multipart file', async(done) => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
    })
    const multipartStartUpload = multipartStart(fileToUpload, settings)
    const {parts} = await multipartStartUpload

    multipartUpload(fileToUpload, parts, settings)
      .then(done)
      .catch(done.fail)
  })
})

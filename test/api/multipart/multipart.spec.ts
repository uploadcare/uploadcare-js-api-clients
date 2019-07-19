import * as factory from '../../_fixtureFactory'
import {getSettingsForTesting} from '../../_helpers'
import multipart from '../../../src/api/multipart/multipart'

describe('API - multipart', () => {
  it('should be able to upload multipart file', async() => {
    const fileToUpload = factory.file(11).data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
    })
    const {uuid} = await multipart(fileToUpload, settings)

    expect(uuid).toBeTruthy()
  })
})

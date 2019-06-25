import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'
import group from '../../src/api/group'

fdescribe('API - group', () => {
  it('should upload group of files', async() => {
    const files = factory.groupOfFiles('valid')
    const settings = getSettingsForTesting({publicKey: factory.publicKey('image')})
    const data = await group(files, settings)

    expect(data).toBeTruthy()
    expect(data.id).toBeTruthy()
    expect(data.files).toBeTruthy()
  })
  it('should fail with [HTTP 400] no files[N] parameters found.', async() => {
    const files = []
    const settings = getSettingsForTesting({publicKey: factory.publicKey('image')})

    try {
      await group(files, settings)
    } catch (error) {
      expect(error.name).toBe('UploadcareError')
    }
  })
  it('should fail with [HTTP 400] this is not valid file url: http://invalid/url.', async() => {
    const files = factory.groupOfFiles('invalid')
    const settings = getSettingsForTesting({publicKey: factory.publicKey('image')})

    try {
      await group(files, settings)
    } catch (error) {
      expect(error.name).toBe('UploadcareError')
    }
  })
  it('should fail with [HTTP 400] some files not found.', async() => {
    const files = factory.groupOfFiles('valid')
    const settings = getSettingsForTesting({publicKey: factory.publicKey('demo')})

    try {
      await group(files, settings)
    } catch (error) {
      expect(error.name).toBe('UploadcareError')
    }
  })
})

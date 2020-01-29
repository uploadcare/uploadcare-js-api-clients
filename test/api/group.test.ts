import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'
import group from '../../src/api/group'
import CancelController from '../../src/tools/CancelController'

describe('API - group', () => {
  const files = factory.groupOfFiles('valid')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image')
  })

  it('should upload group of files', async () => {
    const data = await group(files, settings)

    expect(data).toBeTruthy()
    expect(data.id).toBeTruthy()
    expect(data.files).toBeTruthy()
  })

  it('should fail with [HTTP 400] no files[N] parameters found.', async () => {
    await expect(group([], settings)).rejects.toThrowError(
      '[400] no files[N] parameters found.'
    )
  })

  it('should fail with [HTTP 400] this is not valid file url: http://invalid/url.', async () => {
    const files = factory.groupOfFiles('invalid')

    await expect(group(files, settings)).rejects.toThrowError(
      `[400] this is not valid file url: ${files[0]}.`
    )
  })

  it('should fail with [HTTP 400] some files not found.', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo')
    })

    await expect(group(files, settings)).rejects.toThrowError(
      '[400] some files not found.'
    )
  })

  it('should be able to cancel uploading', async () => {
    const controller = new CancelController()

    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      cancel: controller
    })

    setTimeout(() => {
      controller.cancel()
    })

    await expect(group(files, settings)).rejects.toThrowError(
      'Request canceled'
    )
  })
})

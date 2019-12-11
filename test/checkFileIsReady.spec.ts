import checkFileIsReady from '../src/checkFileIsReady'
import * as factory from './_fixtureFactory'
import { getSettingsForTesting } from './_helpers'
import info from '../src/api/info'
import CancelError from '../src/errors/CancelError'
import TimeoutError from '../src/errors/TimeoutError'

describe('checkFileIsReady', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000

  const fileToUpload = factory.uuid('image')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image')
  })

  it('should be resolved if file is ready', async () => {
    const { uuid } = await info(fileToUpload, settings)
    const result = await checkFileIsReady({
      uuid,
      settings
    })

    expect(result.is_ready).toBeTruthy()
  })
  it('should be cancelable', async () => {
    const { uuid } = await info(fileToUpload, settings)
    const polling = checkFileIsReady({
      uuid,
      settings
    })
    const promise = polling
    polling.cancel()

    await (expectAsync(promise) as any).toBeRejectedWithError(CancelError)
  })
  it('should be rejected after timeout', async () => {
    const { uuid } = await info(fileToUpload, settings)
    const polling = checkFileIsReady({
      uuid,
      settings,
      timeout: -1000
    })
    const promise = polling

    await (expectAsync(promise) as any).toBeRejectedWithError(TimeoutError)
  })
})

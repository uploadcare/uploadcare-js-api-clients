import checkFileIsReady from '../src/checkFileIsReady'
import * as factory from './_fixtureFactory'
import {getSettingsForTesting} from './_helpers'
import info from '../src/api/info'
import CancelError from '../src/errors/CancelError'
import TimeoutError from '../src/errors/TimeoutError'

describe('checkFileIsReady', () => {
  it('should be resolved if file is ready', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })
    const {uuid} = await info(factory.uuid('image'), settings)

    const result = await checkFileIsReady({
      uuid,
      settings,
    }).promise

    expect(result.is_ready).toBeTruthy()
  })
  it('should be cancelable', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })
    const {uuid} = await info(factory.uuid('image'), settings)

    const polling = checkFileIsReady({
      uuid,
      settings,
    })

    polling.cancel()

    await (expectAsync(polling.promise) as any).toBeRejectedWithError(CancelError)
  })
  it('should be rejected after timeout', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })
    const {uuid} = await info(factory.uuid('image'), settings)
    const polling = checkFileIsReady({
      uuid,
      settings,
      timeout: 1,
    })

    await (expectAsync(polling.promise) as any).toBeRejectedWithError(TimeoutError)
  })
})

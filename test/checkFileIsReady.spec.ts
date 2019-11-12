import checkFileIsReady from '../src/checkFileIsReady'
import * as factory from './_fixtureFactory'
import {getSettingsForTesting} from './_helpers'
import info from '../src/api/info'

fdescribe('checkFileIsReady', () => {
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

    try {
      await polling.promise

      setTimeout(() => {
        polling.cancel()
      }, 1)
    } catch (error) {
      expect(error.name === 'CancelError').toBeTruthy()
    }
  })
  it('should be rejected after timeout', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })
    const {uuid} = await info(factory.uuid('image'), settings)

    try {
      const polling = checkFileIsReady({
        uuid,
        settings,
        timeout: 1,
      })

      await polling.promise
    } catch (error) {
      expect(error.name === 'TimeoutError').toBeTruthy()
    }
  })
})

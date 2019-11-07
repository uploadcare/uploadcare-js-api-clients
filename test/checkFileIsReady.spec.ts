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
  it('should be cancelable', async (done) => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })
    const {uuid} = await info(factory.uuid('image'), settings)

    const polling = checkFileIsReady({
      uuid,
      settings,
    })

    setTimeout(() => {
      polling.cancel()
    }, 1)

    await polling.promise
      .then(() => done.fail('Promise should not to be resolved'))
      .catch((error) => {
        if (error.name === 'CancelError') {
          done()
        } else {
          done.fail(error)
        }
      })
  })
  it('should be rejected after timeout', async (done) => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })
    const {uuid} = await info(factory.uuid('image'), settings)

    const polling = checkFileIsReady({
      uuid,
      settings,
      timeout: 10,
    })

    await polling.promise
      .then(() => done.fail('Promise should not to be resolved'))
      .catch((error) => {
        if (error.name === 'TimeoutError') {
          done()
        } else {
          done.fail(error)
        }
      })
  })
})

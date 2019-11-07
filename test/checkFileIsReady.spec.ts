import checkFileIsReady from '../src/checkFileIsReady'
import * as factory from './_fixtureFactory'
import {getSettingsForTesting} from './_helpers'
import info from '../src/api/info'
import CancelError from '../src/errors/CancelError'
import TimeoutError from '../src/errors/TimeoutError'

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

    polling
      .promise
      .catch((error) => {
        if (error.name === 'CancelError') {
          done()
        } else {
          done.fail(error)
        }
      })

    setTimeout(() => {
      polling.cancel()
    }, 1)
  })

  it('should be rejected after timeout', async (done) => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })
    const {uuid} = await info(factory.uuid('image'), settings)

    const polling = checkFileIsReady({
      uuid,
      settings,
      timeout: 1,
    })

    polling
      .promise
      .catch((error) => {
      if (error.name === 'TimeoutError') {
        done()
      } else {
        done.fail(error)
      }
    })
  })
})

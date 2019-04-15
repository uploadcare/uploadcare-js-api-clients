import checkFileIsReady from '../src/checkFileIsReady'
import * as factory from './_fixtureFactory'
import {Environment, getSettingsForTesting} from './_helpers'

const environment = Environment.Staging

describe('checkFileIsReady', () => {
  it('should be resolved if file is ready', async() => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
    }, environment)
    const info = await checkFileIsReady({
      uuid: factory.uuid('image'),
      timeout: 50,
      settings,
    })

    expect(info.is_ready).toBeTruthy()
  })
  it('should be cancelable', (done) => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
    }, environment)
    const polling = checkFileIsReady({
      uuid: factory.uuid('image'),
      timeout: 50,
      settings,
    })

    setTimeout(() => {
      polling.cancel()
    }, 5)

    polling
      .then(() => done.fail())
      .catch((error) => {
        if (error.name === 'CancelError') {
          done()
        } else {
          done.fail(error)
        }
      })
  })
})

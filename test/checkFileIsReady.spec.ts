import checkFileIsReady from '../src/checkFileIsReady'
import * as factory from './_fixtureFactory'
import {getSettingsForTesting} from './_helpers'

const settings = getSettingsForTesting({
  publicKey: factory.publicKey('image'),
})

describe('checkFileIsReady', () => {
  it('should be resolved if file is ready', async() => {
    const info = await checkFileIsReady({
      uuid: factory.uuid('image'),
      settings,
    })

    expect(info.is_ready).toBeTruthy()
  })
  it('should be cancelable', (done) => {
    const polling = checkFileIsReady({
      uuid: factory.uuid('image'),
      settings,
    })

    setTimeout(() => {
      polling.cancel()
    }, 1)

    polling
      .then(() => done.fail('Promise should not to be resolved'))
      .catch((error) => {
        if (error.name === 'CancelError') {
          done()
        } else {
          done.fail(error)
        }
      })
  })
})

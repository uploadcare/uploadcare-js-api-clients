import checkFileIsReady from '../src/checkFileIsReady'
import * as factory from './_fixtureFactory'
import {getSettingsForTesting} from './_helpers'
import info from '../src/api/info'

describe('checkFileIsReady', async () => {
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image')
  })
  const {uuid} = await info(factory.uuid('image'), settings)

  it('should be resolved if file is ready', async () => {
    const info = await checkFileIsReady({
      uuid,
      settings,
    })

    expect(info.is_ready).toBeTruthy()
  })
  it('should be cancelable', (done) => {
    const polling = checkFileIsReady({
      uuid,
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

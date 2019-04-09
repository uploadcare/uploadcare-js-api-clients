import checkFileIsReady from '../src/checkFileIsReady'
import * as factory from './_fixtureFactory'

describe('checkFileIsReady', () => {
  it('should be resolved if file is ready', async() => {
    const info = await checkFileIsReady({
      uuid: factory.uuid('image'),
      timeout: 50,
      settings: {publicKey: factory.publicKey('image')}
    })

    expect(info.is_ready).toBeTruthy()
  })
  it('should be cancelable', (done) => {
    checkFileIsReady({
      uuid: factory.uuid('image'),
      timeout: 50,
      settings: {publicKey: factory.publicKey('image')}
    })
      .then(() => done.fail())
      .catch((error) => {
        if (error.name !== 'CancelError') {
          done.fail(error)
        }
      })
  })
})

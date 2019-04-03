import checkFileIsReady from '../src/checkFileIsReady'
import * as factory from './_fixtureFactory'

describe('checkFileIsReady', () => {
  it('should be resolved if file is ready', async() => {
    let timerId = null

    await expectAsync(
      checkFileIsReady(
        factory.uuid('image'),
        null,
        50,
        timerId,
        {publicKey: factory.publicKey('image')}
      )
    )
      .toBeResolved()
  })
  // TODO: checkFileIsReady should be cancellable
  it('should be cancellable', async() => {
    let timerId = null

    await expectAsync(
      checkFileIsReady(
        factory.uuid('image'),
        null,
        50,
        timerId,
        {publicKey: factory.publicKey('image')}
      )
    )
      .toBeResolved()

    if (timerId) {
      clearTimeout(timerId)
    }
  })
})

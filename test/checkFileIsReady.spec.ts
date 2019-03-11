import checkFileIsReady from '../src/checkFileIsReady'
import * as factory from './_fixtureFactory'

describe('checkFileIsReady', () => {
  it('should resolved if file is ready', async() => {
    await expectAsync(checkFileIsReady(factory.uuid('image'), null, 50, {publicKey: factory.publicKey('image')}))
      .toBeResolved()
  })
})

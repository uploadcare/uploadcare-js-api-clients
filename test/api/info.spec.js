import info from '../../src/api/info'
import * as factory from '../fixtureFactory'

describe('API - info', () => {
  it('should return file info', async() => {
    const fileInfo = await info(factory.uuid('image'), {publicKey: factory.publicKey('image')})

    expect(fileInfo.uuid).toBeTruthy()
  })
})

import info from '../../src/api/info'
import * as factory from '../fixtureFactory'

describe('API - info', () => {
  it('should return file info', async() => {
    const response = await info(factory.uuid('image'), {publicKey: factory.publicKey('image')})

    expect(response.uuid).toBeTruthy()
  })

  it('should be rejected with bad options', (done) => {
    info(factory.uuid('image'), {publicKey: ''})
      .then(() => done.fail())
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })
})

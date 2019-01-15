import info from '../../src/api/info'
import * as factory from '../_fixtureFactory'

describe('API - info', () => {
  it('should return file info', async() => {
    const data = await info(factory.uuid('image'), {publicKey: factory.publicKey('image')})

    expect(data.uuid).toBeTruthy()
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

import fromUrlStatus from '../../src/api/fromUrlStatus'
import * as factory from '../_fixtureFactory'

describe('API - from url status', () => {
  it('should return info about file uploaded from url', async() => {
    const data = await fromUrlStatus(factory.token('valid'))

    expect(data.uuid).toBeTruthy()
  })

  it('should be rejected with bad options', (done) => {
    fromUrlStatus(factory.token('valid'), {publicKey: ''})
      .then(() => done.fail())
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })

  it('should be rejected with empty token', (done) => {
    fromUrlStatus(factory.token('empty'))
      .then(() => done.fail())
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })
})

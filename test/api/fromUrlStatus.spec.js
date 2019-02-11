import * as factory from '../_fixtureFactory'
import fromUrlStatus from '../../src/api/fromUrlStatus'

describe('API - from url status', () => {
  it('should return info about file uploaded from url', async() => {
    const data = await fromUrlStatus(factory.token('valid'))

    expect(data.uuid).toBeTruthy()
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

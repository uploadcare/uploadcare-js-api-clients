import fromUrlStatus from '../../src/api/fromUrlStatus'
import * as factory from '../_fixtureFactory'

describe('API - from url status', () => {
  it('should return info about file uploaded from url', async() => {
    const token = factory.token('valid')
    const data = await fromUrlStatus(token)

    expect(data.status).toBeTruthy()
  })

  it('should be rejected with empty token', (done) => {
    const token = factory.token('empty')

    fromUrlStatus(token)
      .then(() => done.fail())
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })
})

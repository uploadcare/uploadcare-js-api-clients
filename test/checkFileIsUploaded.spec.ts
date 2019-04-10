import * as factory from './_fixtureFactory'
import checkFileIsUploaded from '../src/checkFileIsUploaded'
import {StatusEnum} from '../src/api/fromUrlStatus'

describe('checkFileIsUploaded', () => {
  it('should be resolved if file is uploaded', async() => {
    checkFileIsUploaded({
      token: factory.token('valid'),
      timeout: 50,
      settings: {publicKey: factory.publicKey('token')}
    })
      .then(info => {
        expect(info.status).toBe(StatusEnum.Success)
      })
  })
  it('should be cancelable', (done) => {
    const polling = checkFileIsUploaded({
      token: factory.token('valid'),
      timeout: 50,
      settings: {publicKey: factory.publicKey('token')}
    })

    setTimeout(() => {
      polling.cancel()
    }, 5)

    polling
      .then(() => done.fail())
      .catch((error) => {
        if (error.name === 'CancelError') {
          done()
        } else {
          done.fail(error)
        }
      })
  })
})

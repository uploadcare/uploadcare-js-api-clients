import * as factory from './_fixtureFactory'
import checkFileIsUploaded from '../src/checkFileIsUploaded'
import {StatusEnum} from '../src/api/fromUrlStatus'

describe('checkFileIsUploaded', () => {
  it('should be resolved if file is uploaded', async() => {
    const status = await checkFileIsUploaded({
      token: factory.uuid('token'),
      timeout: 50,
      settings: {publicKey: factory.publicKey('token')}
    })

    expect(status.status).toBe(StatusEnum.Success)
  })
})

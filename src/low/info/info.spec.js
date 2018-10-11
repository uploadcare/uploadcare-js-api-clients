import {info} from './info'
import * as factory from '../../../test/fixtureFactory'

describe('info', () => {
  it('should return UCRequest', () => {
    const ucRequest = info('', {})

    expect(ucRequest).toBeInstanceOf(Promise)
  })

  it('should get info about some file', async() => {
    const uuid = factory.uuid('image')
    const publicKey = factory.publicKey('image')

    const {code, data} = await info(uuid, {publicKey})

    expect.assertions(4)

    expect(code).toBe(200)
    expect(data).toBeTruthy()
    expect(data.is_image).toBeTruthy()
    expect(data.uuid).toBe(uuid)
  })
})

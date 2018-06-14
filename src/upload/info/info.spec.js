import {info} from './info'
import * as factory from '../../../test/fixtureFactory'

describe('info', () => {
  it('should return UCRequest', () => {
    const ucRequest = info('', {})

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
    expect(ucRequest.cancel).toBeInstanceOf(Function)
    expect(ucRequest.progress).toBeInstanceOf(Function)
  })

  it('should get info about some file', async() => {
    const uuid = factory.uuid('image')
    const publicKey = factory.publicKey('image')

    const ucRequest = info(uuid, {publicKey})

    const {code, data} = await ucRequest.promise

    expect.assertions(4)

    expect(code).toBe(200)
    expect(data).toBeTruthy()
    expect(data.is_image).toBeTruthy()
    expect(data.uuid).toBe(uuid)
  })
})

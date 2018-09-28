import {multipartStart} from './multipartStart'
import * as factory from '../../../test/fixtureFactory'

describe('multipartStart', () => {
  it('should return UCRequest', () => {
    const ucRequest = multipartStart({})

    expect(ucRequest).toBeInstanceOf(Promise)
  })

  it('should get uuid and parts', async() => {
    const publicKey = factory.publicKey('demo')

    const {code, data} = await multipartStart({
      publicKey,
      filename: 'test',
      size: 20000000,
    })

    expect.assertions(4)

    expect(code).toBe(200)
    expect(data).toBeTruthy()
    expect(data.uuid).toBeTruthy()
    expect(data.parts.length).toBeTruthy()
  })
})

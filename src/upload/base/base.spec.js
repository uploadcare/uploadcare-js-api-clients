import {base} from './base'
import * as factory from '../../../test/fixtureFactory'

describe('base', () => {
  it('should return UCRequest', () => {
    const ucRequest = base('file', {})

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
    expect(ucRequest.cancel).toBeInstanceOf(Function)
    expect(ucRequest.progress).toBeInstanceOf(Function)
  })

  it('should upload simple image', async() => {
    const file = factory.image('blackSquare')

    const ucRequest = base(file, {
      publicKey: factory.publicKey('demo'),
      store: false,
    })

    const {code, data} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(200)
    expect(data).toBeTruthy()
    expect(data.file).toBeTruthy()
  })
})

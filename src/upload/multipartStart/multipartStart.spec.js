import {multipartStart} from './multipartStart'
import * as factory from '../../../test/fileFactory'

fdescribe('multipartStart', () => {
  it('should return UCRequest', () => {
    const ucRequest = multipartStart({})

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
    expect(ucRequest.cancel).toBeInstanceOf(Function)
    expect(ucRequest.progress).toBeInstanceOf(Function)
  })

  it('should get uuid and parts', async() => {
    const publicKey = factory.publicKey('demo')

    const {code, data} = await multipartStart({
      publicKey,
      filename: 'test',
      size: 20000000,
    }).promise

    expect.assertions(4)

    expect(code).toBe(200)
    expect(data).toBeTruthy()
    expect(data.uuid).toBeTruthy()
    expect(data.parts.length).toBeTruthy()
  })
})

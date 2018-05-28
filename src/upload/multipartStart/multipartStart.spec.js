import {multipartStart} from './multipartStart'

describe('multipartStart', () => {
  it('should return UCRequest', () => {
    const ucRequest = multipartStart({})

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.response).toBeInstanceOf(Promise)
    expect(ucRequest.cancel).toBeInstanceOf(Function)
    expect(ucRequest.progress).toBeInstanceOf(Function)
  })

  it('should get uuid and parts', async() => {
    const {code, data} = await multipartStart().response

    expect(code).toBe(200)
    expect(data).toBeTruthy()
    expect(data.uuid).toBeTruthy()
    expect(data.parts.length).toBeTruthy()
  })
})

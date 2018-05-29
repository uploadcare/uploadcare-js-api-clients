import {group} from './index'

describe('group', () => {
  it('should return UCRequest', () => {
    const files = []
    const options = {publicKey: ''}
    const ucRequest = group(files, options)

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
  })
  it('should upload group of files', async() => {
    const files = []
    const options = {publicKey: ''}
    const ucRequest = group(files, options)

    const {code, response} = await ucRequest.promise

    expect.assertions(4)

    expect(code).toBe(200)
    expect(response).toBeTruthy()
    expect(response.id).toBeTruthy()
    expect(response.files).toBeTruthy()
  })
})

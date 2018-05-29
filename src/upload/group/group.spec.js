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

    expect.assertions(5)

    expect(code).toBe(200)
    expect(response).toBeTruthy()
    expect(response.id).toBeTruthy()
    expect(response.files).toBeTruthy()
    expect(response.files).toBeInstanceOf(Array)
  })
  it('should fail with [HTTP 400] no files[N] parameters found.', async() => {
    const files = []
    const options = {publicKey: ''}
    const ucRequest = group(files, options)

    const {code, response} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(400)
    expect(response).toBeTruthy()
    expect(response.error).toBe('No files[N] parameters found')
  })
  it('should fail with [HTTP 400] this is not valid file url: http://invalid/url.', async() => {
    const files = []
    const options = {publicKey: ''}
    const ucRequest = group(files, options)

    const {code, response} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(400)
    expect(response).toBeTruthy()
    expect(response.error).toBe('this is not valid file url: http://invalid/url.')
  })
  it('should fail with [HTTP 400] some files not found.', async() => {
    const files = []
    const options = {publicKey: ''}
    const ucRequest = group(files, options)

    const {code, response} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(400)
    expect(response).toBeTruthy()
    expect(response.error).toBe('some files not found.')
  })
})

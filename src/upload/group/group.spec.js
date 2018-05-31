import {group} from './group'
import * as factory from '../../../test/fixtureFactory'

describe('group', () => {
  it('should return UCRequest', () => {
    const files = []
    const options = {publicKey: factory.publicKey('demo')}
    const ucRequest = group(files, options)

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
    expect(ucRequest.cancel).toBeInstanceOf(Function)
    expect(ucRequest.progress).toBeInstanceOf(Function)
  })
  it('should upload group of files', async() => {
    const files = []
    const options = {publicKey: factory.publicKey('demo')}
    const ucRequest = group(files, options)

    const {code, data} = await ucRequest.promise

    expect.assertions(5)

    expect(code).toBe(200)
    expect(response).toBeTruthy()
    expect(data.id).toBeTruthy()
    expect(data.files).toBeTruthy()
    expect(data.files).toBeInstanceOf(Array)
  })
  it('should fail with [HTTP 400] no files[N] parameters found.', async() => {
    const files = []
    const options = {publicKey: factory.publicKey('demo')}
    const ucRequest = group(files, options)

    const {code, data} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(400)
    expect(data).toBeTruthy()
    expect(data.error).toBe('No files[N] parameters found')
  })
  it('should fail with [HTTP 400] this is not valid file url: http://invalid/url.', async() => {
    const files = []
    const options = {publicKey: factory.publicKey('demo')}
    const ucRequest = group(files, options)

    const {code, data} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(400)
    expect(data).toBeTruthy()
    expect(data.error).toBe('this is not valid file url: http://invalid/url.')
  })
  it('should fail with [HTTP 400] some files not found.', async() => {
    const files = []
    const options = {publicKey: factory.publicKey('demo')}
    const ucRequest = group(files, options)

    const {code, data} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(400)
    expect(data).toBeTruthy()
    expect(data.error).toBe('some files not found.')
  })
})

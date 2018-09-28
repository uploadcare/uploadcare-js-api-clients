import {group} from './group'
import * as factory from '../../../test/fixtureFactory'

describe('group', () => {
  it('should return UCRequest', () => {
    const files = factory.groupOfFiles('valid')
    const options = {publicKey: factory.publicKey('image')}
    const ucRequest = group(files, options)

    expect(ucRequest).toBeInstanceOf(Promise)
  })
  it('should upload group of files', async() => {
    const files = factory.groupOfFiles('valid')
    const options = {publicKey: factory.publicKey('image')}
    const {code, data} = await group(files, options)

    expect.assertions(5)

    expect(code).toBe(200)
    expect(data).toBeTruthy()
    expect(data.id).toBeTruthy()
    expect(data.files).toBeTruthy()
    expect(data.files).toBeInstanceOf(Array)
  })
  it('should fail with [HTTP 400] no files[N] parameters found.', async() => {
    const files = []
    const options = {publicKey: factory.publicKey('image')}
    const {code, data} = await group(files, options)

    expect.assertions(3)

    expect(code).toBe(400)
    expect(data).toBeTruthy()
    expect(data.error.content).toBe('no files[N] parameters found.')
  })
  it('should fail with [HTTP 400] this is not valid file url: http://invalid/url.', async() => {
    const files = factory.groupOfFiles('invalid')
    const options = {publicKey: factory.publicKey('image')}
    const {code, data} = await group(files, options)

    expect.assertions(3)

    expect(code).toBe(400)
    expect(data).toBeTruthy()
    expect(data.error.content).toBe('this is not valid file url: 2e6b7f23-9143-4b71-94e7-338bb.')
  })
  it('should fail with [HTTP 400] some files not found.', async() => {
    const files = factory.groupOfFiles('valid')
    const options = {publicKey: factory.publicKey('demo')}
    const {code, data} = await group(files, options)

    expect.assertions(3)

    expect(code).toBe(400)
    expect(data).toBeTruthy()
    expect(data.error.content).toBe('some files not found.')
  })
})

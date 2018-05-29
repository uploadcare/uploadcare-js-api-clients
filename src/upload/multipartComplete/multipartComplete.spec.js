import {multipartComplete} from './multipartComplete'
import {multipartStart} from '../multipartStart'
import {multipartUpload} from '../multipartUpload'
import * as factory from '../../../test/fileFactory'

describe('multipartComplete', () => {
  it('should return UCRequest', () => {
    const ucRequest = multipartComplete({})

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
    expect(ucRequest.cancel).toBeInstanceOf(Function)
    expect(ucRequest.progress).toBeInstanceOf(Function)
  })

  it('should upload some file via multipart', async() => {
    const file = factory.file(6)
    const publicKey = factory.publicKey('demo')

    // start multipart uploading: get uuid and url parts
    const {data: {uuid, parts}} = await multipartStart({publicKey}).promise

    // upload files as single part to the first url
    const {code: uploadCode} = await multipartUpload(parts[0], file)

    expect.assertions(3)

    await expect(uploadCode).toBe(200)

    // complete multipart: get uploaded file info
    const {code, data} = await multipartComplete(uuid, {publicKey}).promise

    await expect(code).toBe(200)
    await expect(data.uuid).toBe(uuid)
  })
})

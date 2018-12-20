import * as factory from './fixtureFactory'
import fileFrom from '../src/fileFrom'

describe('fileFrom', () => {
  it('should resolves when file is ready on CDN', async() => {
    const fileToUpload = factory.file(0.5)

    const file = fileFrom('object', fileToUpload.data, {publicKey: factory.publicKey('demo')})

    const fileInfo = await file.promise

    expect(file.status).toBe('ready')
    expect(fileInfo.is_ready).toBe(true)
  })
})

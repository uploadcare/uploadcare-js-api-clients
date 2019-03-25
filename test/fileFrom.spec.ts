import * as factory from './_fixtureFactory'
import fileFrom, {FileFrom} from '../src/fileFrom'
import {sleep} from './_helpers'

describe('fileFrom', () => {
  const fileToUpload = factory.image('blackSquare')

  it('should resolves when file is ready on CDN', async() => {
    const fromObject = fileFrom(FileFrom.Object, fileToUpload.data, {publicKey: factory.publicKey('demo')})
    const filePromise = fromObject.upload()
    const file = await filePromise

    expect(fromObject.getProgress().state).toBe('ready')
    expect(file.cdnUrl).toBeTruthy()
  })

  it('should accept doNotStore setting', async() => {
    const fromObject = fileFrom(FileFrom.Object, fileToUpload.data, {
      publicKey: factory.publicKey('demo'),
      doNotStore: true,
    })
    const filePromise = fromObject.upload()
    const file = await filePromise

    expect(file.isStored).toBeFalsy()
  })

  it('should be able to cancel uploading', (done) => {
    const fromObject = fileFrom(FileFrom.Object, fileToUpload.data, {publicKey: factory.publicKey('demo')})
    const filePromise = fromObject.upload()

    setTimeout(() => {
      // @ts-ignore
      fromObject.cancel()
    }, 10)

    filePromise
      .then(() => done.fail())
      .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
  })

  it('should accept new file name setting', async() => {
    const fromObject = fileFrom(FileFrom.URL, fileToUpload.data, {
      publicKey: factory.publicKey('demo'),
      doNotStore: true,
      fileName: 'newFileName.jpg',
    })
    const filePromise = fromObject.upload()
    const file = await filePromise

    expect(file.name).toEqual('newFileName.jpg')
  })

  describe('should be able to handle', () => {
    /* Wait to bypass the requests limits */
    beforeEach((done) => {
      sleep(1000).then(() => done())
    })

    it('cancel uploading', (done) => {
      const fromObject = fileFrom(FileFrom.Object, fileToUpload.data, {publicKey: factory.publicKey('demo')})
      const filePromise = fromObject.upload()

      setTimeout(() => {
        // @ts-ignore
        fromObject.cancel()
      }, 10)

      fromObject.onCancel = () => {
        done()
      }

      filePromise
        .then(() => done.fail())
        .catch((error) => {
          if (error.name !== 'CancelError') {
            done.fail(error)
          }
        })
    })

    it('progress', (done) => {
      let progress = 0
      const fromObject = fileFrom(FileFrom.Object, fileToUpload.data, {publicKey: factory.publicKey('demo')})
      const filePromise = fromObject.upload()

      fromObject.onProgress = () => {
        progress += 1
      }

      filePromise
        .then(() => progress ? done() : done.fail())
        .catch(error => done.fail(error))
    })

    it('uploaded', (done) => {
      const fromObject = fileFrom(FileFrom.Object, fileToUpload.data, {publicKey: factory.publicKey('demo')})
      const filePromise = fromObject.upload()

      fromObject.onUploaded = () => {
        done()
      }

      filePromise
        .then(() => done.fail())
        .catch(error => done.fail(error))
    })

    it('ready', (done) => {
      const fromObject = fileFrom(FileFrom.Object, fileToUpload.data, {publicKey: factory.publicKey('demo')})
      const filePromise = fromObject.upload()

      fromObject.onReady = () => {
        done()
      }

      filePromise
        .catch(error => done.fail(error))
    })
  })
})

import * as factory from '../_fixtureFactory'
import fileFrom, {FileFrom} from '../../src/fileFrom/fileFrom'
import {sleep} from '../_helpers'
import {ProgressState} from '../../src/fileFrom/UploadFrom'

describe('fileFrom', () => {
  const fileToUpload = factory.image('blackSquare')

  it('should resolves when file is ready on CDN', async() => {
    const filePromise = fileFrom(FileFrom.Object, fileToUpload.data, {publicKey: factory.publicKey('demo')})
    const file = await filePromise

    expect(filePromise.getProgressState()).toBe(ProgressState.Ready)
    expect(file.cdnUrl).toBeTruthy()
  })

  it('should accept doNotStore setting', async() => {
    const filePromise = fileFrom(FileFrom.Object, fileToUpload.data, {
      publicKey: factory.publicKey('demo'),
      doNotStore: true,
    })
    const file = await filePromise

    expect(file.isStored).toBeFalsy()
  })

  it('should be able to cancel uploading', (done) => {
    const filePromise = fileFrom(FileFrom.Object, fileToUpload.data, {publicKey: factory.publicKey('demo')})

    setTimeout(() => {
      filePromise.cancel()
    }, 10)

    filePromise
      .then(() => done.fail())
      .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
  })

  it('should accept new file name setting', async() => {
    const filePromise = fileFrom(FileFrom.URL, fileToUpload.data, {
      publicKey: factory.publicKey('demo'),
      doNotStore: true,
      fileName: 'newFileName.jpg',
    })
    const file = await filePromise

    expect(file.name).toEqual('newFileName.jpg')
  })

  describe('should be able to handle', () => {
    /* Wait to bypass the requests limits */
    beforeEach((done) => {
      sleep(1000).then(() => done())
    })

    it('cancel uploading', (done) => {
      const filePromise = fileFrom(FileFrom.Object, fileToUpload.data, {publicKey: factory.publicKey('demo')})

      setTimeout(() => {
        // @ts-ignore
        filePromise.cancel()
      }, 10)

      filePromise.onCancel = () => {
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
      const filePromise = fileFrom(FileFrom.Object, fileToUpload.data, {publicKey: factory.publicKey('demo')})

      filePromise.onProgress = () => {
        progress += 1
      }

      filePromise
        .then(() => progress ? done() : done.fail())
        .catch(error => done.fail(error))
    })

    it('uploaded', (done) => {
      const filePromise = fileFrom(FileFrom.Object, fileToUpload.data, {publicKey: factory.publicKey('demo')})

      filePromise.onUploaded = () => {
        done()
      }

      filePromise
        .then(() => done.fail())
        .catch(error => done.fail(error))
    })

    it('ready', (done) => {
      const filePromise = fileFrom(FileFrom.Object, fileToUpload.data, {publicKey: factory.publicKey('demo')})

      filePromise.onReady = () => {
        done()
      }

      filePromise
        .catch(error => done.fail(error))
    })
  })
})

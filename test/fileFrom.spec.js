import * as factory from './_fixtureFactory'
import fileFrom from '../src/fileFrom'

describe('fileFrom', () => {
  it('should resolves when file is ready on CDN', async() => {
    const fileToUpload = factory.image('blackSquare')

    const file = fileFrom('object', fileToUpload.data, {publicKey: factory.publicKey('demo')})

    const fileInfo = await file

    expect(file.status).toBe('ready')
    expect(fileInfo.is_ready).toBe(true)
  })

  it('should accept doNotStore setting', async() => {
    const fileToUpload = factory.image('blackSquare')

    const file = fileFrom('object', fileToUpload.data, {
      publicKey: factory.publicKey('demo'),
      doNotStore: true,
    })

    await expectAsync(file).toBeResolvedTo(jasmine.objectContaining({is_stored: false}))
  })

  it('should be able to cancel uploading', (done) => {
    const fileToUpload = factory.image('blackSquare')

    const file = fileFrom('object', fileToUpload.data, {publicKey: factory.publicKey('demo')})

    setTimeout(() => {
      file.cancel()
    }, 10)

    file
      .then(() => done.fail())
      .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
  })

  it('should be able to handle cancel uploading', (done) => {
    const fileToUpload = factory.image('blackSquare')

    const file = fileFrom('object', fileToUpload.data, {publicKey: factory.publicKey('demo')})

    setTimeout(() => {
      file.cancel()
    }, 10)

    file.onCancel = () => {
      done()
    }

    file
      .then(() => done.fail())
      .catch((error) => {
        if (error.name !== 'CancelError') {
          done.fail(error)
        }
      })
  })

  it('should be able to handle progress', (done) => {
    let progress = 0
    const fileToUpload = factory.image('blackSquare')

    const file = fileFrom('object', fileToUpload.data, {publicKey: factory.publicKey('demo')})

    file.onProgress = () => {
      progress += 1
    }

    file
      .then(() => progress ? done() : done.fail())
      .catch(error => done.fail(error))
  })
})

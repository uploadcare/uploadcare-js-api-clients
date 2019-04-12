import info from '../../src/api/info'
import * as factory from '../_fixtureFactory'
import {Environment, getEnvironmentSettings} from '../_helpers'

const environment = Environment.Staging

describe('API - info', () => {
  it('should return file info', async() => {
    const settings = getEnvironmentSettings({
      publicKey: factory.publicKey('image')
    }, environment)
    const data = await info(factory.uuid('image'), settings)

    expect(data.uuid).toBeTruthy()
  })

  it('should be rejected with bad options', (done) => {
    const settings = getEnvironmentSettings({
      publicKey: factory.publicKey('empty'),
    }, environment)

    info(factory.uuid('image'), settings)
      .then(() => done.fail())
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })
})

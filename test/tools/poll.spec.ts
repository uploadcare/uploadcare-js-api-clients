import poll from '../../src/tools/poll'
import {InfoResponse} from '../../src/api/info'
import info from '../../src/api/info'
import {Environment, getSettingsForTesting} from '../_helpers'
import * as factory from '../_fixtureFactory'
import CancelError from '../../src/errors/CancelError'

const environment = Environment.Production

describe('poll', () => {
  const uuid = factory.uuid('image')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image'),
  }, environment)
  const onProgress = (response) => {
    return response
  }

  it('should be resolved', async() => {
    const result = await poll<InfoResponse>(
      async () => {
        const response = await info(uuid, settings)

        if (response.is_ready) {
          return response
        }

        if (typeof onProgress === 'function') {
          onProgress(response)
        }

        return false
      },
    )

    expect(result.is_ready).toBeTruthy()
  })

  it('should be able to cancel polling', (done) => {
    const polling = poll<InfoResponse>(
      async() => {
        const response = await info(uuid, settings)

        if (response.is_ready) {
          return response
        }

        if (typeof onProgress === 'function') {
          onProgress(response)
        }

        return false
      },
    )

    setTimeout(() => {
      polling.cancel()
    }, 1)

    polling
      .then(() => done.fail('Promise should not to be resolved'))
      .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
  })
})

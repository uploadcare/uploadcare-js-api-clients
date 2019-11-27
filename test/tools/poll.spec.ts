import poll from '../../src/tools/poll'
import info from '../../src/api/info'
import {getSettingsForTesting} from '../_helpers'
import * as factory from '../_fixtureFactory'

describe('poll', () => {
  const uuid = factory.uuid('image')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image'),
  })

  it('should be resolved', async() => {
    const result = await poll(
      () => {
        const request = info(uuid, settings)
        let cancel = () => request.cancel()

        let promise = request.then(response => {
          if (response.is_ready) {
            return response
          }

          return false
        })

        // @ts-ignore
        promise.cancel = cancel

        return promise
      },
      300
    )

    // @ts-ignore
    expect(result.is_ready).toBeTruthy()
  })

  it('should be able to cancel polling', (done) => {
    const polling = poll(
      async() => {
        const request = info(uuid, settings)
        let cancel = () => request.cancel()

        let promise = request.then(response => {
          if (response.is_ready) {
            return response
          }

          return false
        })

        // @ts-ignore
        promise.cancel = cancel

        return promise
      },
      300
    )

    setTimeout(() => {
      // @ts-ignore
      polling.cancel()
    }, 1)

    polling
      .then(() => done.fail('Promise should not to be resolved'))
      .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
  })
})

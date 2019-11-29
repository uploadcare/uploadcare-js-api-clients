import poll from '../../src/tools/poll'
import info from '../../src/api/info'
import {getSettingsForTesting} from '../_helpers'
import * as factory from '../_fixtureFactory'
import CancelError from '../../src/errors/CancelError'
import {FileInfoInterface} from '../../src/api/types'
import checkFileIsReady from '../../src/checkFileIsReady'
import TimeoutError from '../../src/errors/TimeoutError'

describe('poll', () => {
  const uuid = factory.uuid('image')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image'),
  })
  const onProgress = (response) => {
    return response
  }

  it('should be resolved', async () => {
    const result = await poll<FileInfoInterface>(
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
  it('should be cancelable', async () => {
    const polling = poll<FileInfoInterface>(
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

    polling.cancel()

    await (expectAsync(polling) as any).toBeRejectedWithError(CancelError)
  })
  it('should be rejected after timeout', async () => {
    const polling = poll<FileInfoInterface>(
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
      0
    )

    await (expectAsync(polling) as any).toBeRejectedWithError(TimeoutError)
  })
})

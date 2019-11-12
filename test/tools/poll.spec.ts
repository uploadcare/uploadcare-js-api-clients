import poll from '../../src/tools/poll'
import info from '../../src/api/info'
import {getSettingsForTesting} from '../_helpers'
import * as factory from '../_fixtureFactory'
import CancelError from '../../src/errors/CancelError'
import {FileInfoInterface} from '../../src/api/types'
import checkFileIsReady from '../../src/checkFileIsReady'

describe('poll', () => {
  const uuid = factory.uuid('image')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image'),
  })
  const onProgress = (response) => {
    return response
  }

  it('should be resolved', async () => {
    const polling = poll<FileInfoInterface>({
      task: info(uuid, settings),
      condition: (response) => {
        if (response.is_ready) {
          return response
        }

        if (typeof onProgress === 'function') {
          onProgress(response)
        }

        return false
      },
      taskName: 'checkFileIsReady',
    })
    const result = await polling.promise

    expect(result.is_ready).toBeTruthy()
  })
  it('should be cancelable', async () => {
    const polling = poll<FileInfoInterface>({
      task: info(uuid, settings),
      condition: (response) => {
        if (response.is_ready) {
          return response
        }

        if (typeof onProgress === 'function') {
          onProgress(response)
        }

        return false
      },
      taskName: 'checkFileIsReady',
    })

    try {
      await polling.promise

      setTimeout(() => {
        polling.cancel()
      }, 1)
    } catch (error) {
      expect(error.name === 'CancelError').toBeTruthy()
    }
  })
  it('should be rejected after timeout', async () => {
    try {
      const polling = poll<FileInfoInterface>({
        task: info(uuid, settings),
        condition: (response) => {
          if (response.is_ready) {
            return response
          }

          if (typeof onProgress === 'function') {
            onProgress(response)
          }

          return false
        },
        taskName: 'checkFileIsReady',
        timeout: 1,
      })

      await polling.promise
    } catch (error) {
      expect(error.name === 'TimeoutError').toBeTruthy()
    }
  })
})

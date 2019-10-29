import poll from '../../src/tools/poll'
import info from '../../src/api/info'
import {getSettingsForTesting} from '../_helpers'
import * as factory from '../_fixtureFactory'
import CancelError from '../../src/errors/CancelError'
import {FileInfoInterface} from '../../src/api/types'

fdescribe('poll', () => {
  const uuid = factory.uuid('image')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image'),
  })
  const onProgress = (response) => {
    return response
  }

  it('should be resolved', async() => {
    const polling = poll<FileInfoInterface>(
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
    const result = await polling.promise

    expect(result.is_ready).toBeTruthy()
  })

  it('should be able to cancel polling', (done) => {
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

    setTimeout(() => {
      polling.cancel()
    }, 1)

    expectAsync(polling.promise).toBeRejectedWith(new CancelError())

    // polling
    //   .promise
    //   .then(() => done.fail('Promise should not to be resolved'))
    //   .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
  })

  it('should be able to cancel any polling', (done) => {
    const createPool = time => {
      let _isReady = false;

      setTimeout(() => (_isReady = true), time);

      return () => _isReady;
    };

    const check = createPool(5000);
    const inst = poll(check);

    // const id = setInterval(() => console.log('         |'), 500)

    inst
      .promise
      .then(() => {
        // clearInterval(id)
        // console.log("         - — poll successfull ends")

        done.fail('Promise should not to be resolved')
      })
      .catch((error) => {
        // clearInterval(id)
        // console.log(`         x — poll finished with ${error.message}`)

        error.name === 'CancelError' ? done() : done.fail(error)
      })

    setTimeout(() => {
      // console.log('         ^ — cancel event')
      inst.cancel()
    }, 1900)
  })

  it('should be rejected after timeout', async (done) => {
    const createPool = time => {
      let _isReady = false;

      setTimeout(() => (_isReady = true), time);

      return () => _isReady;
    };

    const check = createPool(5000);
    const inst = poll(check, 1000);

    // const id = setInterval(() => console.log('         |'), 500)

    inst
      .promise
      .then(() => {
        // clearInterval(id)
        // console.log("         - — poll successfull ends")

        done.fail('Promise should not to be resolved')
      })
      .catch((error) => {
        // clearInterval(id)
        // console.log(`         x — poll finished with ${error.message}`)

        error.name === 'TimeoutError' ? done() : done.fail(error)
      })

    setTimeout(() => {
      // console.log('         ^ — cancel event')
      inst.cancel()
    }, 1900)
  })
})

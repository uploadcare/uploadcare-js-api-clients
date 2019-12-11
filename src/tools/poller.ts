import CancelError from '../../src/errors/CancelError'
import TimeoutError from '../../src/errors/TimeoutError'
import CancelController from '../CancelController'

type CheckFunction = (cancel: CancelController | undefined) => Promise<boolean> | boolean

const DEFAULT_TIMEOUT = 10000
const DEFAULT_INTERVAL = 500

const poller = ({
  check,
  timeout = DEFAULT_TIMEOUT,
  interval = DEFAULT_INTERVAL,
  cancelController,
}: {
  check: CheckFunction
  timeout?: number
  interval?: number
  cancelController?: CancelController
}) =>
  new Promise((resolve, reject) => {
    let timeoutId: number
    const startTime = Date.now()
    const endTime = startTime + timeout

    if (cancelController) {
      cancelController.onCancel(() => {
        timeoutId && clearTimeout(timeoutId)
        reject(new CancelError())
      })
    }

    const tick = async () => {
      try {
        const result = await check(cancelController)
        const nowTime = Date.now()

        if (result) {
          resolve(result)
        } else if (nowTime > endTime) {
          reject(new TimeoutError('Poll Timeout'))
        } else {
          // @ts-ignore
          timeoutId = setTimeout(tick, interval)
        }
      } catch (error) {
        reject(error)
      }
    }

    timeoutId = setTimeout(tick)
  })

export { poller as poll, CheckFunction }

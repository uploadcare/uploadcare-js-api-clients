import CancelController from '../../src/tools/CancelController'

type Callback = () => void
type StrangeFn<T> = (args: {
  callback: Callback
  cancel: CancelController
}) => Promise<T>

const race = <T>(
  fns: StrangeFn<T>[],
  { cancel }: { cancel?: CancelController } = {}
): Promise<T> => {
  let lastError: Error | null = null
  let winnerIndex: number | null = null
  const controllers = fns.map(() => new CancelController())
  const createCancelCallback = (i: number) => (): void => {
    winnerIndex = i

    controllers.forEach(
      (controller, index) => index !== i && controller.cancel()
    )
  }

  if (cancel) {
    cancel.onCancel(() => {
      controllers.forEach(controller => controller.cancel())
    })
  }

  return Promise.all(
    fns.map((fn, i) => {
      const callback = createCancelCallback(i)

      return Promise.resolve()
        .then(() => fn({ callback, cancel: controllers[i] }))
        .then(result => {
          callback()

          return result
        })
        .catch(error => {
          lastError = error
          return null
        })
    })
  ).then(results => {
    if (winnerIndex === null) {
      throw lastError
    } else {
      return results[winnerIndex] as T
    }
  })
}

export { race }

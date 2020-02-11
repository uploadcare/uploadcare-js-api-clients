import CancelController from './CancelController'

type Callback = () => void
type StrangeFn<T> = (args: {
  stopRace: Callback
  cancel: CancelController
}) => Promise<T>

const race = <T>(
  fns: StrangeFn<T>[],
  { cancel }: { cancel?: CancelController } = {}
): Promise<T> => {
  let lastError: Error | null = null
  let winnerIndex: number | null = null
  const controllers = fns.map(() => new CancelController())
  const createStopRaceCallback = (i: number) => (): void => {
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
      const stopRace = createStopRaceCallback(i)

      return Promise.resolve()
        .then(() => fn({ stopRace, cancel: controllers[i] }))
        .then(result => {
          stopRace()

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

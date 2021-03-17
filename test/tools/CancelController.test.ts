import CancelController from '../../src/tools/CancelController'

describe('CancelController', () => {
  it('should work', (done) => {
    const ctrl = new CancelController()

    ctrl.onCancel(done)
    ctrl.cancel()
  })

  it('should run onCancel callback ones', async () => {
    const ctrl = new CancelController()
    const onCancel = jest.fn()

    ctrl.onCancel(onCancel)
    ctrl.cancel()
    ctrl.cancel()

    // onCancel works async
    // this hack for wait execution of CancelController
    const spy = await Promise.resolve(onCancel)

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should execute more than one callback', async () => {
    const ctrl = new CancelController()
    const firstOnCancel = jest.fn()
    const secondOnCancel = jest.fn()

    ctrl.onCancel(firstOnCancel)
    ctrl.onCancel(secondOnCancel)

    ctrl.cancel()

    // onCancel works async
    // this hack for wait execution of CancelController
    const [spy1, spy2] = await Promise.resolve([firstOnCancel, secondOnCancel])

    expect(spy1).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenCalledTimes(1)
  })

  it('should run callback on already cancelled controller', async () => {
    const spy = jest.fn()
    const ctrl = new CancelController()

    ctrl.cancel()
    // this hack for wait execution of CancelController
    await Promise.resolve()

    ctrl.onCancel(spy)

    // this hack for wait execution of CancelController
    await Promise.resolve()

    expect(spy).toHaveBeenCalled()
  })
})

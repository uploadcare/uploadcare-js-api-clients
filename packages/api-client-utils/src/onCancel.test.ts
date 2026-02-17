import { onCancel } from '@uploadcare/api-client-utils'
import { vi, expect } from 'vitest'

describe('onCancel', () => {
  it('should work', async () => {
    const ctrl = new AbortController()
    const callback = vi.fn()

    onCancel(ctrl.signal, callback)
    ctrl.abort()

    // Wait for async execution
    await Promise.resolve()

    expect(callback).toHaveBeenCalled()
  })

  it('should run callback ones', async () => {
    const ctrl = new AbortController()
    const hanlder = vi.fn()

    ctrl.abort()
    onCancel(ctrl.signal, hanlder)
    ctrl.abort()

    // onCancel works async
    // this hack for wait execution of AbortController
    const spy = await Promise.resolve(hanlder)

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should execute more than one callback', async () => {
    const ctrl = new AbortController()
    const firstOnCancel = vi.fn()
    const secondOnCancel = vi.fn()

    onCancel(ctrl.signal, firstOnCancel)
    onCancel(ctrl.signal, secondOnCancel)

    ctrl.abort()

    // onCancel works async
    // this hack for wait execution of onCancel
    const [spy1, spy2] = await Promise.resolve([firstOnCancel, secondOnCancel])

    expect(spy1).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenCalledTimes(1)
  })

  it('should run callback on already aborted signal', async () => {
    const spy = vi.fn()
    const ctrl = new AbortController()

    ctrl.abort()
    onCancel(ctrl.signal, spy)

    // this hack for wait execution of onCancel
    await Promise.resolve()

    expect(spy).toHaveBeenCalled()
  })
})

import CancelController from '../../src/tools/CancelController'
import { race } from '../../src/tools/race'
import { cancelError } from '../../src/tools/errors'

const returnAfter = (
  value: number,
  cancel: CancelController,
  ms = 30
): Promise<number> =>
  new Promise<number>((resolve, reject) => {
    const id = setTimeout(resolve, ms, value)
    cancel.onCancel(() => {
      clearTimeout(id)
      reject(cancelError('race cancel'))
    })
  })

fdescribe('race', () => {
  it('should work', async () => {
    const value = await race([
      ({ cancel }): Promise<number> => returnAfter(1, cancel),
      ({ cancel }): Promise<number> => returnAfter(2, cancel, 1),
      ({ cancel }): Promise<number> => returnAfter(3, cancel),
      ({ cancel }): Promise<number> => returnAfter(4, cancel),
      ({ cancel }): Promise<number> => returnAfter(5, cancel)
    ])

    expect(value).toBe(2)
  })

  it('should work if first function fails sync', async () => {
    const value = await race([
      (): Promise<number> => {
        throw new Error('test 1')
      },
      ({ cancel }): Promise<number> => returnAfter(2, cancel, 1),
      ({ cancel }): Promise<number> => returnAfter(3, cancel),
      ({ cancel }): Promise<number> => returnAfter(4, cancel),
      ({ cancel }): Promise<number> => returnAfter(5, cancel)
    ])

    expect(value).toBe(2)
  })

  it('should work if first function fails async', async () => {
    const value = await race([
      (): Promise<number> => Promise.reject('test 1'),
      ({ cancel }): Promise<number> => returnAfter(2, cancel, 1),
      ({ cancel }): Promise<number> => returnAfter(3, cancel),
      ({ cancel }): Promise<number> => returnAfter(4, cancel),
      ({ cancel }): Promise<number> => returnAfter(5, cancel)
    ])

    expect(value).toBe(2)
  })

  it('should throw error if all function fails', async () => {
    await expectAsync(
      race([
        (): Promise<number> => Promise.reject('test 1'),
        (): Promise<number> => Promise.reject('test 2'),
        (): Promise<number> => Promise.reject('test 3'),
        (): Promise<number> => Promise.reject('test 4'),
        (): Promise<number> => Promise.reject('test 5')
      ])
    ).toBeRejectedWith('test 5')
  })

  it('should cancel all functions when first resolves', async () => {
    const spies = Array.from({ length: 5 }, i =>
      jasmine.createSpy('cancel for ' + i)
    )

    const createCancelHandler = (index: number) => (error): number => {
      spies[index]()

      throw error
    }

    const value = await race([
      ({ cancel }): Promise<number> =>
        returnAfter(1, cancel, 1).catch(createCancelHandler(0)),
      ({ cancel }): Promise<number> =>
        returnAfter(2, cancel).catch(createCancelHandler(1)),
      ({ cancel }): Promise<number> =>
        returnAfter(3, cancel).catch(createCancelHandler(2)),
      ({ cancel }): Promise<number> =>
        returnAfter(4, cancel).catch(createCancelHandler(3)),
      ({ cancel }): Promise<number> =>
        returnAfter(5, cancel).catch(createCancelHandler(4))
    ])

    expect(value).toBe(1)

    spies.forEach((spy, index) => {
      if (index !== 0) {
        expect(spy).toHaveBeenCalled()
      }
    })
  })

  it('should cancel all functions when callback fires', async () => {
    const spies = Array.from({ length: 5 }, i =>
      jasmine.createSpy('cancel for ' + i)
    )

    const createCancelHandler = (index: number) => (error): number => {
      spies[index]()

      throw error
    }

    const value = await race([
      ({ callback }): Promise<number> => {
        callback()

        return Promise.resolve(1)
      },
      ({ cancel }): Promise<number> =>
        returnAfter(2, cancel).catch(createCancelHandler(1)),
      ({ cancel }): Promise<number> =>
        returnAfter(3, cancel).catch(createCancelHandler(2)),
      ({ cancel }): Promise<number> =>
        returnAfter(4, cancel).catch(createCancelHandler(3)),
      ({ cancel }): Promise<number> =>
        returnAfter(5, cancel).catch(createCancelHandler(4))
    ])

    expect(value).toBe(1)

    spies.forEach((spy, index) => {
      if (index !== 0) {
        expect(spy).toHaveBeenCalled()
      }
    })
  })

  it('should be cancellable', async () => {
    const cancel = new CancelController()

    const spies = Array.from({ length: 5 }, i =>
      jasmine.createSpy('cancel for ' + i)
    )

    const createCancelHandler = (index: number) => (error): number => {
      spies[index]()

      throw error
    }

    setTimeout(() => cancel.cancel())

    await expectAsync(
      race(
        [
          ({ cancel }): Promise<number> =>
            returnAfter(1, cancel).catch(createCancelHandler(0)),
          ({ cancel }): Promise<number> =>
            returnAfter(2, cancel).catch(createCancelHandler(1)),
          ({ cancel }): Promise<number> =>
            returnAfter(3, cancel).catch(createCancelHandler(2)),
          ({ cancel }): Promise<number> =>
            returnAfter(4, cancel).catch(createCancelHandler(3)),
          ({ cancel }): Promise<number> =>
            returnAfter(5, cancel).catch(createCancelHandler(4))
        ],
        { cancel }
      )
    ).toBeRejectedWithError('race cancel')

    spies.forEach(spy => {
      expect(spy).toHaveBeenCalled()
    })
  })
})

import { delay } from '@uploadcare/api-client-utils'
import { Queue } from '../../src/tools/Queue'
import { expect } from 'vitest'

const DELAY = 100
const TIME_TOLERANCE = DELAY / 2

describe('Queue', () => {
  describe('#add', () => {
    it('should return promise resolved with the same value', async () => {
      expect.assertions(1)
      const queue = new Queue(1)
      const promise = queue.add(() => Promise.resolve('result'))
      await expect(promise).resolves.toBe('result')
    })

    it('should return promise rejected with the same error', async () => {
      expect.assertions(1)
      const queue = new Queue(1)
      const promise = queue.add(() => Promise.reject('result'))
      await expect(promise).rejects.toBe('result')
    })
  })

  it('should handle rejected promises', async () => {
    expect.assertions(2)
    const queue = new Queue(4)
    const promises = [
      queue.add(() => Promise.resolve()),
      queue.add(() => Promise.reject()),
      queue.add(() => Promise.resolve()),
      queue.add(() => Promise.reject())
    ]
    expect(queue.running).toBe(4)
    await Promise.allSettled(promises)
    expect(queue.running).toBe(0)
  })

  it('should run tasks in LILO sequense', async () => {
    expect.assertions(1)
    const queue = new Queue(1)
    const order: number[] = []
    const promises = [
      queue.add(() => Promise.resolve().then(() => order.push(1))),
      queue.add(() => Promise.resolve().then(() => order.push(2))),
      queue.add(() => Promise.resolve().then(() => order.push(3)))
    ]
    await Promise.all(promises)
    await delay(0)
    expect(order).toEqual([1, 2, 3])
  })

  it('should run tasks concurrently', async () => {
    expect.assertions(12)
    const queue = new Queue(4)
    const times: number[] = []
    const startTime = Date.now()
    const promises = Array.from({ length: 12 }).map(() => {
      return queue.add(() =>
        delay(DELAY).then(() => times.push(Date.now() - startTime))
      )
    })
    await Promise.all(promises)

    expect(Math.abs(times[0] - DELAY * 1)).toBeLessThan(TIME_TOLERANCE)
    expect(Math.abs(times[1] - DELAY * 1)).toBeLessThan(TIME_TOLERANCE)
    expect(Math.abs(times[2] - DELAY * 1)).toBeLessThan(TIME_TOLERANCE)
    expect(Math.abs(times[3] - DELAY * 1)).toBeLessThan(TIME_TOLERANCE)

    expect(Math.abs(times[4] - DELAY * 2)).toBeLessThan(TIME_TOLERANCE)
    expect(Math.abs(times[5] - DELAY * 2)).toBeLessThan(TIME_TOLERANCE)
    expect(Math.abs(times[6] - DELAY * 2)).toBeLessThan(TIME_TOLERANCE)
    expect(Math.abs(times[7] - DELAY * 2)).toBeLessThan(TIME_TOLERANCE)

    expect(Math.abs(times[8] - DELAY * 3)).toBeLessThan(TIME_TOLERANCE)
    expect(Math.abs(times[9] - DELAY * 3)).toBeLessThan(TIME_TOLERANCE)
    expect(Math.abs(times[10] - DELAY * 3)).toBeLessThan(TIME_TOLERANCE)
    expect(Math.abs(times[11] - DELAY * 3)).toBeLessThan(TIME_TOLERANCE)
  })

  describe('get pending', () => {
    it('should be able to get pending tasks count', async () => {
      expect.assertions(3)
      const queue = new Queue(2)
      expect(queue.pending).toBe(0)
      const promises = [
        queue.add(() => Promise.resolve()),
        queue.add(() => Promise.resolve()),
        queue.add(() => Promise.resolve())
      ]
      // 2 task is running, 1 are pending
      expect(queue.pending).toBe(1)
      await Promise.all(promises)
      expect(queue.pending).toBe(0)
    })
  })

  describe('get running', () => {
    it('should be able to get running tasks count', async () => {
      expect.assertions(3)
      const queue = new Queue(2)
      expect(queue.running).toBe(0)
      const promises = [
        queue.add(() => Promise.resolve()),
        queue.add(() => Promise.resolve()),
        queue.add(() => Promise.resolve())
      ]
      expect(queue.running).toBe(2)
      await Promise.all(promises)
      expect(queue.running).toBe(0)
    })
  })

  describe('get concurrency', () => {
    it('should be able to get concurrency', async () => {
      expect.assertions(1)
      const queue = new Queue(2)
      expect(queue.concurrency).toBe(2)
    })
  })
  describe('set concurrency', () => {
    it('should be able to change concurrency', async () => {
      expect.assertions(9)
      const queue = new Queue(1)
      const times: number[] = []
      const startTime = Date.now()
      const promises = Array.from({ length: 5 }).map(() => {
        return queue.add(() =>
          delay(DELAY).then(() => times.push(Date.now() - startTime))
        )
      })
      await delay(0)
      expect(queue.running).toBe(1)
      await promises[0]
      queue.concurrency = 2
      expect(queue.concurrency).toBe(2)
      expect(queue.running).toBe(2)
      await Promise.all(promises)

      expect(Math.abs(times[0] - DELAY * 1)).toBeLessThan(TIME_TOLERANCE)

      expect(Math.abs(times[1] - DELAY * 2)).toBeLessThan(TIME_TOLERANCE)
      expect(Math.abs(times[2] - DELAY * 2)).toBeLessThan(TIME_TOLERANCE)

      expect(Math.abs(times[3] - DELAY * 3)).toBeLessThan(TIME_TOLERANCE)
      expect(Math.abs(times[4] - DELAY * 3)).toBeLessThan(TIME_TOLERANCE)

      expect(queue.running).toBe(0)
    })
  })
})

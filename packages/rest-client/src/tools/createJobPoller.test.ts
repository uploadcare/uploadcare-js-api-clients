import { vi } from 'vitest'
import { CancelError } from '@uploadcare/api-client-utils'
import { createJobPoller } from './createJobPoller'

describe('createJobPoller', () => {
  it('should pass proper objects in the all callbacks', async () => {
    const runner = vi.fn(async () => ({
      result: ['finished', 'failed']
    }))
    const resolveJobs = vi.fn((response: Awaited<ReturnType<typeof runner>>) =>
      response.result.map((r) => ({ status: r }))
    )
    const getJobStatus = vi.fn(
      async (job: ReturnType<typeof resolveJobs>[number]) => job.status
    )
    const isJobFinished = vi.fn((response) => response === 'finished')
    const isJobFailed = vi.fn((response) => response === 'failed')
    const getResult = vi.fn(async () => 'result')
    const getError = vi.fn(async () => 'error')
    const poller = createJobPoller({
      runner,
      resolveJobs,
      getJobStatus,
      isJobFinished,
      isJobFailed,
      getResult,
      getError
    })

    const options = {}
    const settings = { setting: 'foo' }

    const promises = await poller(options, settings)

    const results = await Promise.all(promises)

    expect(runner.mock.calls.length).toBe(1)
    expect(runner.mock.lastCall).toEqual([options, settings])

    expect(resolveJobs.mock.calls.length).toBe(1)
    expect(resolveJobs.mock.lastCall).toEqual([
      { result: ['finished', 'failed'] },
      options,
      settings
    ])

    expect(getJobStatus.mock.calls.length).toBe(2)
    expect(getJobStatus.mock.calls[0]).toEqual([{ status: 'finished' }])
    expect(getJobStatus.mock.calls[1]).toEqual([{ status: 'failed' }])

    expect(isJobFinished.mock.calls.length).toBe(2)
    expect(isJobFinished.mock.calls[0]).toEqual(['finished'])
    expect(isJobFinished.mock.calls[1]).toEqual(['failed'])

    expect(isJobFailed.mock.calls.length).toBe(1)
    expect(isJobFailed.mock.calls[0]).toEqual(['failed'])

    expect(getResult.mock.calls.length).toBe(1)
    expect(getResult.mock.calls[0]).toEqual([
      { status: 'finished' },
      'finished'
    ])

    expect(getError.mock.calls.length).toBe(1)
    expect(getError.mock.calls[0]).toEqual([{ status: 'failed' }, 'failed'])

    expect(results).toEqual(['result', 'error'])
  })

  it('should be able to abort polling', async () => {
    const abortController = new AbortController()

    const getJobStatus = vi.fn(async () => {
      setTimeout(() => abortController.abort(), 0)
      return 'status'
    })

    const poller = createJobPoller({
      runner: async () => ({ result: 'test' }),
      resolveJobs: (response) => [response.result],
      getJobStatus,
      isJobFinished: () => false,
      isJobFailed: () => false,
      getResult: async () => 'result',
      getError: async () => 'error'
    })

    const promises = await poller(
      { pollOptions: { signal: abortController.signal } },
      {}
    )

    await expect(promises[0]).rejects.toThrowError(
      new CancelError('Poll cancelled')
    )
    expect(getJobStatus.mock.calls.length).toBe(1)
  })

  it('should be able to abort request', async () => {
    const getJobStatus = vi.fn(async () => 'status')

    const poller = createJobPoller({
      runner: async () => ({ result: 'test' }),
      resolveJobs: (response) => [response.result],
      getJobStatus: async () => 'status',
      isJobFinished: () => false,
      isJobFailed: () => false,
      getResult: async () => 'result',
      getError: async () => 'error'
    })

    const abortController = new AbortController()
    abortController.abort()
    const request = poller(
      { pollOptions: { signal: abortController.signal } },
      {}
    )

    await expect(request).rejects.toThrowError(
      new CancelError('Request canceled')
    )
    expect(getJobStatus.mock.calls.length).toBe(0)
  })
})

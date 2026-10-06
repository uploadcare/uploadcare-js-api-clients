import { XMLHttpRequestInterceptor } from '@mswjs/interceptors/XMLHttpRequest'
import { expect, it, vi } from 'vitest'
import { setupEmulator } from '../../src/browser.js'

vi.mock('msw/browser', () => ({
  setupWorker: () => ({
    start: () => Promise.reject(new Error('no /mockServiceWorker.js')),
    stop: () => {}
  })
}))

it('leaves no XHR interceptor applied when the worker fails to start', async () => {
  const apply = vi.spyOn(XMLHttpRequestInterceptor.prototype, 'apply')

  await expect(setupEmulator().reset()).rejects.toThrow(
    'no /mockServiceWorker.js'
  )

  expect(apply).not.toHaveBeenCalled()
})

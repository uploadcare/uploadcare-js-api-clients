import { expect, it } from 'vitest'
import { setupEmulator } from '../../src/browser.js'

it('registers the worker from workerUrl, leaving nothing patched when that fails', async () => {
  const { XMLHttpRequest, WebSocket } = globalThis

  await expect(
    setupEmulator({ workerUrl: '/nope/mockServiceWorker.js' }).reset()
  ).rejects.toThrow('/nope/mockServiceWorker.js')

  expect(globalThis.XMLHttpRequest).toBe(XMLHttpRequest)
  expect(globalThis.WebSocket).toBe(WebSocket)
})

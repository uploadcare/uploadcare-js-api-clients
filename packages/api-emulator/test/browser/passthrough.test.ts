import { afterAll, beforeEach, expect, it, vi } from 'vitest'
import { setupEmulator } from '../../src/browser.js'
import { foreignOrigin, sendXhr } from './helpers.js'

const emulator = setupEmulator({ unhandled: 'passthrough' })

beforeEach(() => emulator.reset())
afterAll(() => emulator.stop())

it("lets a foreign origin through under unhandled: 'passthrough'", async () => {
  const error = vi.spyOn(console, 'error')
  const url = `${foreignOrigin()}/package.json`

  expect((await fetch(url)).status).toBe(200)
  expect((await sendXhr('GET', url)).status).toBe(200)

  expect(error).not.toHaveBeenCalled()
  error.mockRestore()
})

it('still fails an unrouted Uploadcare path rather than reaching the real API', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  await expect(fetch('https://upload.uploadcare.com/nope/')).rejects.toThrow(
    TypeError
  )

  expect(warn).toHaveBeenCalledOnce()
  warn.mockRestore()
})

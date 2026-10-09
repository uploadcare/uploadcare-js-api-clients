import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { setupEmulator } from '../../src/node.js'
import { sendNode, startLocalServer } from './helpers.js'

const emulator = setupEmulator({ unhandled: 'passthrough' })
let local: Awaited<ReturnType<typeof startLocalServer>>

beforeAll(async () => {
  local = await startLocalServer()
})
beforeEach(() => emulator.reset())
afterAll(async () => {
  await emulator.stop()
  await local.close()
})

it("lets a foreign origin through under unhandled: 'passthrough'", async () => {
  const error = vi.spyOn(console, 'error')

  expect(await (await fetch(`${local.origin}/`)).text()).toBe('local')
  expect(await sendNode('GET', `${local.origin}/`)).toEqual({
    status: 200,
    body: 'local'
  })

  expect(error).not.toHaveBeenCalled()
})

it('still fails an unrouted Uploadcare path rather than reaching the real API', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  await expect(fetch('https://upload.uploadcare.com/nope/')).rejects.toThrow(
    TypeError
  )

  expect(warn).toHaveBeenCalledOnce()
})

it('still refuses an Uploadcare host it does not emulate, naming it', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const urls = [
    'https://api.uploadcare.com/files/',
    'https://sub.ucarecdn.com/'
  ]

  for (const url of urls) {
    await expect(fetch(url)).rejects.toThrow(TypeError)
    expect(await sendNode('GET', url)).toHaveProperty('error')
  }

  expect(error.mock.calls.map(([message]) => message)).toEqual(
    urls.flatMap((url) => [
      expect.stringContaining(url),
      expect.stringContaining(url)
    ])
  )
})

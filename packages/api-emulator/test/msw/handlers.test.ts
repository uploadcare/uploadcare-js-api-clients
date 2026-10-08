import { setupServer } from 'msw/node'
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { resetSession } from '../../src/index.js'
import { emulatorHandlers } from '../../src/msw.js'

// What a dev server's `virtual:msw` network does with them, in Node: any MSW
// network that takes handlers.
const server = setupServer(
  ...emulatorHandlers({ cdnHosts: ['cdn.example.com'] })
)

beforeAll(() => server.listen())
beforeEach(() => resetSession())
afterAll(() => server.close())

it('answers the emulated hosts, the default session behind them', async () => {
  const form = new FormData()
  form.set('UPLOADCARE_PUB_KEY', 'demopublickey')
  form.set('file', new Blob([new Uint8Array([1, 2, 3])]), 'file.bin')
  const uploaded = await fetch('https://upload.uploadcare.com/base/', {
    method: 'POST',
    body: form
  })
  const { file } = (await uploaded.json()) as { file: string }

  const served = await fetch(`https://cdn.example.com/${file}/`)
  expect(new Uint8Array(await served.arrayBuffer())).toEqual(
    new Uint8Array([1, 2, 3])
  )
})

it('refuses a foreign origin by default, naming it', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})

  await expect(fetch('https://example.com/')).rejects.toThrow(TypeError)

  expect(error).toHaveBeenCalledWith(
    expect.stringContaining('https://example.com/')
  )
  error.mockRestore()
})

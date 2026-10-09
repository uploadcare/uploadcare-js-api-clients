import { afterAll, beforeEach, expect, it, vi } from 'vitest'
import { setupEmulator } from '@uploadcare/api-emulator/browser'
import type { EmulatorSession } from '@uploadcare/api-emulator'
import { CancelError } from '@uploadcare/api-client-utils'
import { uploadFile } from '../../src/uploadFile'

const emulator = setupEmulator()
let session: EmulatorSession

beforeEach(async () => {
  session = await emulator.reset()
})
afterAll(() => emulator.stop())

const MB = 1024 * 1024
const bytes = (size: number) =>
  new Blob([new Uint8Array(size).fill(7)], { type: 'application/octet-stream' })
const settings = { publicKey: 'demopublickey', fileName: 'blob.bin' }

it('uploads a Blob directly, reporting computable progress up to 1', async () => {
  const onProgress = vi.fn()

  const file = await uploadFile(bytes(5 * MB), { ...settings, onProgress })

  expect(session.files.get(file.uuid)).toMatchObject({
    name: 'blob.bin',
    size: 5 * MB
  })
  const values = onProgress.mock.calls.map(([p]) => p.value)
  // A 5 MB body arrives in many `xhr.upload` chunks; jsdom fires none.
  expect(new Set(values).size).toBeGreaterThan(2)
  expect(onProgress).toHaveBeenLastCalledWith({ isComputable: true, value: 1 })
})

it('uploads a Blob past the multipart threshold in 5 MB part PUTs', async () => {
  const file = await uploadFile(bytes(11 * MB), {
    ...settings,
    multipartMinFileSize: 10 * MB
  })

  expect(session.files.get(file.uuid)?.size).toBe(11 * MB)
  const parts = session.requests.filter((r) => r.method === 'PUT')
  expect(parts).toHaveLength(3)
})

// The emulator stores the file anyway: its XHR interceptor has the whole body
// before it reports upload progress (see api-emulator's README), so only the
// client side of an abort is asserted.
it('aborts the upload XHR itself when the signal fires during upload progress', async () => {
  const controller = new AbortController()

  const upload = uploadFile(bytes(5 * MB), {
    ...settings,
    signal: controller.signal,
    onProgress: () => controller.abort()
  })

  // 'Request canceled', not 'Poll cancelled': the XHR itself was aborted.
  await expect(upload).rejects.toThrowError(new CancelError('Request canceled'))
})

import { afterAll, beforeEach, expect, it, vi } from 'vitest'
import { setupEmulator } from '../../src/browser.js'
import { DEMO_IMAGE_UUID } from '../../src/index.js'
import {
  foreignOrigin,
  loadImage,
  pngOf,
  sendXhr,
  uploadForm
} from './helpers.js'

const emulator = setupEmulator({ cdnHosts: ['cdn.example.com'] })

beforeEach(() => emulator.reset())
afterAll(() => emulator.stop())

const upload = async (file: Blob) => {
  const result = await sendXhr(
    'POST',
    'https://upload.uploadcare.com/base/',
    uploadForm(file)
  )
  expect(result.status).toBe(200)
  return { ...result, uuid: (JSON.parse(result.body) as { file: string }).file }
}

// The macrotask is the contract file-uploader's progress events depend on (see
// the hold in `src/msw.ts`). Chromium's body reads already span tasks, so
// this passes without the hold too; the body-less XHR below is what guards
// the hold itself.
it('answers an XHR upload with per-chunk upload progress, a macrotask after send()', async () => {
  const result = await upload(new Blob([new Uint8Array(5 * 1024 * 1024)]))

  expect(
    result.uploadEvents.filter((type) => type === 'progress').length
  ).toBeGreaterThan(1)
  expect(result.uploadEvents.at(-1)).toBe('loadend')
  expect(result.macrotaskBeforeUpload).toBe(true)
})

// An XHR with a body spans a task anyway (the interceptor reads the body to
// emit upload progress), so only a body-less one shows the hold itself.
const seededInfo = `https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=${DEMO_IMAGE_UUID}`

it('holds a body-less XHR a macrotask before it loads', async () => {
  const result = await sendXhr('GET', seededInfo)
  expect(result.status).toBe(200)
  expect(result.macrotaskBeforeLoad).toBe(true)
})

it('answers in the same task under a scenario registered with hold: false', async () => {
  const session = await emulator.reset()
  session.on('GET /info/', ({ next }) => next(), { hold: false })

  const result = await sendXhr('GET', seededInfo)
  expect(result.status).toBe(200)
  expect(result.macrotaskBeforeLoad).toBe(false)
})

it.each(['ucarecdn.com', 'abcdef1234.ucarecd.net', 'cdn.example.com'])(
  'serves the uploaded bytes to an <img> from the CDN host %s',
  async (host) => {
    const { uuid } = await upload(await pngOf(3, 2))

    const img = await loadImage(`https://${host}/${uuid}/`)
    expect([img.naturalWidth, img.naturalHeight]).toEqual([3, 2])
  }
)

it.each([
  [[3, 2]],
  // Past 65535 bytes of pixels: more than one deflate block.
  [[100_000, 99_999]]
])(
  'draws a derivative of aspect_ratio %j that an <img> decodes at its reported size',
  async (ratio) => {
    const api = 'https://upload.uploadcare.com'
    const started = await fetch(`${api}/derivative/image/generate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        pub_key: 'demopublickey',
        prompt: 'a hat',
        aspect_ratio: ratio,
        filename: 'generated.png'
      })
    })
    const { job_id: jobId } = (await started.json()) as { job_id: string }
    let frame: {
      is_ready?: boolean
      uuid: string
      image_info: { width: number; height: number }
    }
    do {
      frame = await (
        await fetch(
          `${api}/derivative/status/?pub_key=demopublickey&job_id=${jobId}`,
          { headers: { Accept: 'application/json' } }
        )
      ).json()
    } while (!frame.is_ready)

    // Each test's session restarts the uuid sequence: the query keeps the
    // browser from answering with the last test's cached image.
    const img = await loadImage(
      `https://ucarecdn.com/${frame.uuid}/?ratio=${ratio.join(':')}`
    )
    expect([img.naturalWidth, img.naturalHeight]).toEqual([
      frame.image_info.width,
      frame.image_info.height
    ])
  }
)

it('answers fetch on the emulated hosts too', async () => {
  const response = await fetch('https://tlm.uploadcare.com/api/v1/events', {
    method: 'POST',
    body: JSON.stringify({ event: 'test' })
  })
  expect(response.status).toBe(200)
})

it('fails an Uploadcare path it has no route for, naming it', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  await expect(fetch('https://upload.uploadcare.com/nope/')).rejects.toThrow(
    TypeError
  )
  const xhr = await sendXhr('POST', 'https://ucarecdn.com/not-a-uuid/', 'x')
  expect(xhr.error).toBe(true)

  expect(warn.mock.calls.map(([message]) => message)).toEqual([
    expect.stringContaining('GET https://upload.uploadcare.com/nope/'),
    expect.stringContaining('POST https://ucarecdn.com/not-a-uuid/')
  ])
  warn.mockRestore()
})

it('refuses a foreign origin by default, naming it', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const url = `${foreignOrigin()}/package.json`

  await expect(fetch(url)).rejects.toThrow(TypeError)
  expect((await sendXhr('GET', url)).error).toBe(true)

  expect(error.mock.calls.map(([message]) => message)).toEqual([
    expect.stringContaining(url),
    expect.stringContaining(url)
  ])
  error.mockRestore()
})

it('passes the page’s own origin through', async () => {
  expect((await fetch('/package.json')).status).toBe(200)
  expect((await sendXhr('GET', '/package.json')).status).toBe(200)
})

it('fails a part PUT that leaks an Authorization header, over XHR and fetch', async () => {
  const form = new FormData()
  form.set('UPLOADCARE_PUB_KEY', 'demopublickey')
  form.set('filename', 'big.jpg')
  form.set('size', String(11 * 1024 * 1024))
  form.set('content_type', 'image/jpeg')
  const started = await fetch(
    'https://upload.uploadcare.com/multipart/start/',
    {
      method: 'POST',
      body: form
    }
  )
  const { parts } = (await started.json()) as { parts: string[] }
  const leaked = { authorization: 'Bearer leaked' }

  expect((await sendXhr('PUT', parts[0], 'x', leaked)).error).toBe(true)
  await expect(
    fetch(parts[0], { method: 'PUT', headers: leaked, body: 'x' })
  ).rejects.toThrow(TypeError)
})

it('starts each test from a fresh session', async () => {
  const { uuid } = await upload(await pngOf(1, 1))
  expect((await fetch(`https://ucarecdn.com/${uuid}/`)).status).toBe(200)

  await emulator.reset()

  expect((await fetch(`https://ucarecdn.com/${uuid}/`)).status).toBe(404)
})

it('answers with the scenarios registered on the handle reset() returns, over XHR and fetch', async () => {
  const session = await emulator.reset()
  session.on('GET /info/', () => new Response('scenario'), { times: 2 })
  const info =
    'https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=x'

  expect(await (await fetch(info)).text()).toBe('scenario')
  expect((await sendXhr('GET', info)).body).toBe('scenario')
  expect((await fetch(info)).status).toBe(404)

  session.on('GET /info/', () => new Response('scenario'))
  await emulator.reset()
  expect(await (await fetch(info)).text()).not.toBe('scenario')
})

it('keeps the session readable from that handle', async () => {
  const session = await emulator.reset()
  const { uuid } = await upload(await pngOf(1, 1))
  expect(session.files.get(uuid)?.image).toMatchObject({ width: 1, height: 1 })
})

it('logs fetch and XHR requests to the handle reset() returns', async () => {
  const session = await emulator.reset()
  await fetch('https://tlm.uploadcare.com/api/v1/events', {
    method: 'POST',
    body: '{}'
  })
  await sendXhr('POST', 'https://tlm.uploadcare.com/api/v1/events', '{}')

  expect(session.requests.map((request) => request.method)).toEqual([
    'POST',
    'POST'
  ])
})

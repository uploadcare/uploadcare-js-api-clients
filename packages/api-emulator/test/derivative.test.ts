import { createHash, createHmac } from 'node:crypto'
import { beforeEach, expect, it } from 'vitest'
import {
  CONTENT_MODERATED_PROMPT,
  DERIVATIVE_DISABLED_PUBLIC_KEY,
  DERIVATIVE_INSTANT_PUBLIC_KEY,
  PROVIDER_UNAVAILABLE_PROMPT,
  resetSession,
  SIGNED_UPLOADS_PUBLIC_KEY,
  SIGNED_UPLOADS_SECRET_KEY
} from '../src/index.js'
import { STOCK_IMAGE } from '../src/state/stock-image.js'
import { call, upload } from './emulator.js'
import { jsonError } from './spec.js'

/**
 * `POST /derivative/image/generate/`, `POST /derivative/image/edit/` and `GET
 * /derivative/status/`. The published Upload API spec doesn't document them
 * (see `UNSPECIFIED_OPERATIONS` in `spec.ts`), so every shape here is the one
 * ai-image-editor's `UploadcareApiClient` sends and reads: a JSON body,
 * `Accept: application/json`, and errors as the JSON envelope carrying a
 * snake_case `error_code`.
 */

const SEEDED = '49b4c5a1-31b3-4349-ba07-d97a2d883c37'
const UPLOAD = 'https://upload.uploadcare.com'

beforeEach(() => resetSession())

const post = (
  path: string,
  body: unknown,
  headers: Record<string, string> = {}
) =>
  call(`${UPLOAD}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers
    },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  })

const generate = (body: Record<string, unknown> = {}) =>
  post('/derivative/image/generate/', {
    pub_key: 'demopublickey',
    prompt: 'a hat',
    aspect_ratio: [1, 1],
    filename: 'generated.png',
    ...body
  })

const edit = (body: Record<string, unknown> = {}) =>
  post('/derivative/image/edit/', {
    pub_key: 'demopublickey',
    prompt: 'remove the cat',
    source: SEEDED,
    filename: 'edited.png',
    ...body
  })

const status = (jobId: string | undefined, pubKey = 'demopublickey') => {
  const url = new URL(`${UPLOAD}/derivative/status/`)
  url.searchParams.set('pub_key', pubKey)
  if (jobId !== undefined) url.searchParams.set('job_id', jobId)
  return call(url, { headers: { Accept: 'application/json' } })
}

const jobIdOf = async (response: Response) => {
  const body = (await response.json()) as { type: string; job_id: string }
  expect(body.type).toBe('job')
  expect(body.job_id).toEqual(expect.any(String))
  return body.job_id
}

type Frame = {
  status: string
  is_ready?: boolean
  uuid?: string
  [key: string]: unknown
}

/** Every frame up to and including the first terminal one. */
const pollToEnd = async (jobId: string) => {
  const frames: Frame[] = []
  for (let poll = 0; poll < 10; poll += 1) {
    const frame = (await (await status(jobId)).json()) as Frame
    frames.push(frame)
    if (frame.status === 'error') return frames
    if (frame.status === 'success' && frame.is_ready) return frames
  }
  throw new Error(`job ${jobId} never finished: ${JSON.stringify(frames)}`)
}

it('starts a generate job and polls it through every non-terminal state to a stored file', async () => {
  const jobId = await jobIdOf(await generate())
  const frames = await pollToEnd(jobId)

  expect(frames.map((frame) => [frame.status, frame.is_ready])).toEqual([
    ['processing', undefined],
    ['uploading', undefined],
    ['success', false],
    ['success', true]
  ])
  expect(frames[0]).toEqual({ type: 'job', status: 'processing' })
  expect(frames[1]).toEqual({ type: 'job', status: 'uploading' })

  const done = frames.at(-1)!
  expect(done).toMatchObject({
    status: 'success',
    uuid: expect.any(String),
    file_id: done.uuid,
    original_filename: 'generated.png',
    is_image: true,
    is_stored: true,
    mime_type: 'image/jpeg',
    size: STOCK_IMAGE.byteLength,
    image_info: { width: expect.any(Number), height: expect.any(Number) }
  })
  // The not-yet-ready frame already names the same file.
  expect(frames[2]?.uuid).toBe(done.uuid)

  const info = await call(
    `${UPLOAD}/info/?pub_key=demopublickey&file_id=${done.uuid}`
  )
  expect(await info.json()).toMatchObject({
    uuid: done.uuid,
    original_filename: 'generated.png'
  })

  const cdn = await call(`https://ucarecdn.com/${done.uuid}/`)
  expect(cdn.status).toBe(200)
  expect(new Uint8Array(await cdn.arrayBuffer())).toEqual(STOCK_IMAGE)
})

it('keeps answering success once the job is done', async () => {
  const jobId = await jobIdOf(await generate())
  const [last] = (await pollToEnd(jobId)).slice(-1)
  expect(await (await status(jobId)).json()).toEqual(last)
})

it('honours store: false', async () => {
  const jobId = await jobIdOf(await generate({ store: false }))
  expect((await pollToEnd(jobId)).at(-1)).toMatchObject({ is_stored: false })
})

it('starts an edit job on an existing file and finishes with a new one', async () => {
  const jobId = await jobIdOf(await edit({ aspect_ratio: [16, 9] }))
  const done = (await pollToEnd(jobId)).at(-1)!
  expect(done).toMatchObject({
    status: 'success',
    original_filename: 'edited.png'
  })
  expect(done.uuid).not.toBe(SEEDED)
})

it('edits a file uploaded in this session', async () => {
  const first = (await pollToEnd(await jobIdOf(await generate()))).at(-1)!
  const jobId = await jobIdOf(await edit({ source: first.uuid }))
  expect((await pollToEnd(jobId)).at(-1)).toMatchObject({ status: 'success' })
})

it('refuses an edit whose source does not exist', async () => {
  expect(await jsonError(await edit({ source: 'no-such-file' }))).toMatchObject(
    { status_code: 404, error_code: 'source_not_found' }
  )
})

it('refuses an edit whose source is not an image', async () => {
  const file = await upload({
    bytes: new TextEncoder().encode('hello'),
    name: 'note.txt',
    type: 'text/plain'
  })

  expect(await jsonError(await edit({ source: file }))).toMatchObject({
    status_code: 400,
    error_code: 'source_not_image'
  })
})

it.each([
  ['generate without a prompt', () => generate({ prompt: '' })],
  [
    'generate without aspect_ratio',
    () => generate({ aspect_ratio: undefined })
  ],
  ['generate without filename', () => generate({ filename: undefined })],
  ['edit without a source', () => edit({ source: undefined })],
  [
    'a body that is not JSON',
    () => post('/derivative/image/generate/?pub_key=demopublickey', 'nope')
  ]
])('refuses %s with invalid_request', async (_, send) => {
  expect(await jsonError(await send())).toMatchObject({
    status_code: 400,
    error_code: 'invalid_request'
  })
})

it.each([[[1]], [[0, 1]], [[1, 2, 3]], [['1', '1']], [[1.5, 1]]])(
  'refuses aspect_ratio %j with invalid_aspect_ratio',
  async (ratio) => {
    expect(
      await jsonError(await generate({ aspect_ratio: ratio }))
    ).toMatchObject({ status_code: 400, error_code: 'invalid_aspect_ratio' })
    expect(await jsonError(await edit({ aspect_ratio: ratio }))).toMatchObject({
      error_code: 'invalid_aspect_ratio'
    })
  }
)

it('asks for a job_id', async () => {
  expect(await jsonError(await status(undefined))).toMatchObject({
    status_code: 400,
    error_code: 'job_id_required'
  })
})

it('does not know a job it never started', async () => {
  expect(await jsonError(await status('nope'))).toMatchObject({
    status_code: 404,
    error_code: 'job_not_found',
    content: 'Derivative job is not found.'
  })
})

it('keeps jobs per session', async () => {
  const jobId = await jobIdOf(await generate())
  const other = await call(
    `${UPLOAD}/derivative/status/?pub_key=demopublickey&job_id=${jobId}`,
    { headers: { Accept: 'application/json' } },
    { session: 'someone-else' }
  )
  expect(await jsonError(other)).toMatchObject({ error_code: 'job_not_found' })
})

it.each([
  [CONTENT_MODERATED_PROMPT, 'content_moderated'],
  [PROVIDER_UNAVAILABLE_PROMPT, 'provider_unavailable']
])(
  'fails the job at poll time for the %s scenario prompt',
  async (prompt, code) => {
    const jobId = await jobIdOf(await generate({ prompt }))
    const frames = await pollToEnd(jobId)
    expect(frames).toEqual([
      { type: 'job', status: 'processing' },
      {
        type: 'job',
        status: 'error',
        error_source: 'ai_gateway',
        error_code: code,
        error: expect.any(String)
      }
    ])
    // Terminal: the next poll says the same.
    expect(await (await status(jobId)).json()).toEqual(frames[1])
  }
)

it('fails an edit job the same way', async () => {
  const jobId = await jobIdOf(await edit({ prompt: CONTENT_MODERATED_PROMPT }))
  expect((await pollToEnd(jobId)).at(-1)).toMatchObject({
    status: 'error',
    error_code: 'content_moderated'
  })
})

it('finishes a job on its first poll for the instant-derivatives project', async () => {
  const jobId = await jobIdOf(
    await generate({ pub_key: DERIVATIVE_INSTANT_PUBLIC_KEY })
  )
  const frames = await pollToEnd(jobId)
  expect(frames).toHaveLength(1)
  expect(frames[0]).toMatchObject({
    status: 'success',
    is_ready: true,
    original_filename: 'generated.png'
  })
})

it('still fails a scenario prompt on the instant-derivatives project, on its first poll', async () => {
  const jobId = await jobIdOf(
    await edit({
      pub_key: DERIVATIVE_INSTANT_PUBLIC_KEY,
      prompt: CONTENT_MODERATED_PROMPT
    })
  )
  expect(await pollToEnd(jobId)).toEqual([
    expect.objectContaining({
      status: 'error',
      error_code: 'content_moderated'
    })
  ])
})

it('refuses both job kinds for a project with derivatives disabled', async () => {
  for (const send of [generate, edit])
    expect(
      await jsonError(await send({ pub_key: DERIVATIVE_DISABLED_PUBLIC_KEY }))
    ).toMatchObject({ status_code: 403, error_code: 'derivative_disabled' })
})

it('checks the public key in the JSON body before anything else', async () => {
  expect(
    await jsonError(await generate({ pub_key: 'nope', prompt: '' }))
  ).toMatchObject({
    status_code: 403,
    error_code: 'ProjectPublicKeyInvalidError',
    content: 'pub_key is invalid.'
  })
  expect(await jsonError(await edit({ pub_key: undefined }))).toMatchObject({
    error_code: 'ProjectPublicKeyInvalidError',
    content: 'pub_key is required.'
  })
  expect(await jsonError(await status('nope', 'nope'))).toMatchObject({
    error_code: 'ProjectPublicKeyInvalidError'
  })
})

it('throttles once on metadata.mock_throttle, read from the JSON body', async () => {
  const send = () => generate({ metadata: { mock_throttle: 'derivative-1' } })
  expect(await jsonError(await send())).toMatchObject({
    status_code: 429,
    error_code: 'RequestThrottledError'
  })
  await jobIdOf(await send())
})

const now = () => Math.floor(Date.now() / 1000)
const encode = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString('base64url')
const sign = (claims: object) => {
  const header = encode({ alg: 'HS256', typ: 'JWT' })
  const payload = encode({ exp: now() + 600, ...claims })
  const key = createHash('sha256')
    .update(SIGNED_UPLOADS_SECRET_KEY, 'utf8')
    .digest()
  const signature = createHmac('sha256', key)
    .update(`${header}.${payload}`)
    .digest('base64url')
  return `${header}.${payload}.${signature}`
}

it('runs a signed-uploads project end to end on a Bearer token', async () => {
  const authorization = `Bearer ${sign({})}`
  expect(
    await jsonError(await generate({ pub_key: SIGNED_UPLOADS_PUBLIC_KEY }))
  ).toMatchObject({ error_code: 'SignatureRequiredError' })

  const started = await post(
    '/derivative/image/generate/',
    {
      pub_key: SIGNED_UPLOADS_PUBLIC_KEY,
      prompt: 'a hat',
      aspect_ratio: [1, 1],
      filename: 'generated.png'
    },
    { authorization }
  )
  const jobId = await jobIdOf(started)
  const polled = await call(
    `${UPLOAD}/derivative/status/?pub_key=${SIGNED_UPLOADS_PUBLIC_KEY}&job_id=${jobId}`,
    { headers: { Accept: 'application/json', authorization } }
  )
  expect(await polled.json()).toEqual({ type: 'job', status: 'processing' })
})

it('scopes a Bearer token by the derivative path', async () => {
  const authorization = `Bearer ${sign({
    uc: { restrictions: { scope: ['/derivative/image/edit/'] } }
  })}`
  const response = await post(
    '/derivative/image/generate/',
    {
      pub_key: 'demopublickey',
      prompt: 'a hat',
      aspect_ratio: [1, 1],
      filename: 'generated.png'
    },
    { authorization }
  )
  expect(await jsonError(response)).toMatchObject({
    error_code: 'ScopeForbiddenError'
  })
  const allowed = await post(
    '/derivative/image/edit/',
    {
      pub_key: 'demopublickey',
      prompt: 'x',
      source: SEEDED,
      filename: 'e.png'
    },
    { authorization }
  )
  await jobIdOf(allowed)
})

it('treats a prompt that names an Object.prototype key as an ordinary prompt', async () => {
  const jobId = await jobIdOf(await generate({ prompt: 'constructor' }))
  expect((await pollToEnd(jobId)).at(-1)).toMatchObject({ status: 'success' })
})

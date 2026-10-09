import { beforeEach, expect, it } from 'vitest'
import {
  DEMO_IMAGE_UUID as SEEDED,
  mintAuthToken,
  resetSession
} from '../src/index.js'
import { imageSize } from '../src/state/image-size.js'
import { call, token, upload } from './emulator.js'
import { jsonError } from './spec.js'

/**
 * `POST /derivative/image/generate/`, `POST /derivative/image/edit/` and `GET
 * /derivative/status/`. The published Upload API spec doesn't document them
 * (see `UNSPECIFIED_OPERATIONS` in `spec.ts`), so every shape here is the one
 * ai-image-editor's `UploadcareApiClient` sends and reads: a JSON body,
 * `Accept: application/json`, and errors as the JSON envelope carrying a
 * snake_case `error_code`.
 */

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
  expect((await cdn.arrayBuffer()).byteLength).toBe(done.size)
})

type ImageInfo = { width: number; height: number; format: string }

/** The finished job's file: what its frame, `-/json/` and its bytes say. */
const resultOf = async (jobId: string) => {
  const done = (await pollToEnd(jobId)).at(-1) as Frame & {
    image_info: ImageInfo
    mime_type: string
  }
  const json = (await (
    await call(`https://ucarecdn.com/${done.uuid}/-/json/`)
  ).json()) as ImageInfo
  const bytes = new Uint8Array(
    await (await call(`https://ucarecdn.com/${done.uuid}/`)).arrayBuffer()
  )
  return { done, json, decoded: imageSize(bytes) }
}

it.each([[[1, 1]], [[3, 2]], [[16, 9]], [[9, 16]], [[1920, 1080]]])(
  'generates an image of aspect_ratio %j, as its frame, -/json/ and bytes all report',
  async ([w, h]) => {
    const { done, json, decoded } = await resultOf(
      await jobIdOf(await generate({ aspect_ratio: [w, h] }))
    )
    const { width, height } = done.image_info
    expect(width * h).toBe(height * w)
    expect(json).toMatchObject({ width, height })
    expect(decoded).toEqual({ width, height, format: done.image_info.format })
    expect(done.mime_type).toBe(`image/${decoded!.format.toLowerCase()}`)
  }
)

it('fits a ratio too fine to draw exactly within 2048 px on its long side', async () => {
  const { done, decoded } = await resultOf(
    await jobIdOf(await generate({ aspect_ratio: [100_000, 99_999] }))
  )
  expect(done.image_info).toMatchObject({ width: 2048, height: 2048 })
  expect(decoded).toMatchObject({ width: 2048, height: 2048 })
})

it('reshapes an edit to its aspect_ratio', async () => {
  const { done, decoded } = await resultOf(
    await jobIdOf(await edit({ aspect_ratio: [16, 9] }))
  )
  expect(done.image_info.width * 9).toBe(done.image_info.height * 16)
  expect(decoded).toMatchObject({
    width: done.image_info.width,
    height: done.image_info.height
  })
})

it('keeps the source dimensions for an edit without aspect_ratio', async () => {
  const { done } = await resultOf(await jobIdOf(await edit()))
  // The seeded stock image.
  expect(done.image_info).toMatchObject({ width: 136, height: 150 })

  const tall = await resultOf(
    await jobIdOf(await generate({ aspect_ratio: [1, 3] }))
  )
  const kept = await resultOf(
    await jobIdOf(await edit({ source: tall.done.uuid }))
  )
  expect(kept.done.image_info).toMatchObject({
    width: tall.done.image_info.width,
    height: tall.done.image_info.height
  })
  expect(kept.done.uuid).not.toBe(tall.done.uuid)
})

/**
 * A `GET /derivative/status/` success frame production sent, verbatim, as
 * ai-image-editor recorded it (`uploadcareApiClient.schemas.dev.test.ts`, "a
 * real derivative status success frame"). The only frame of these routes
 * checked against the real API.
 */
const PRODUCTION_SUCCESS_FRAME = {
  size: 1620930,
  total: 1620930,
  done: 1620930,
  uuid: '2e0c4294-32e0-4999-aed1-e78221224339',
  file_id: '2e0c4294-32e0-4999-aed1-e78221224339',
  original_filename: 'generated.png',
  is_image: true,
  is_stored: false,
  image_info: {
    dpi: null,
    width: 1248,
    format: 'PNG',
    height: 832,
    sequence: false,
    color_mode: 'RGB',
    orientation: null,
    geo_location: null,
    datetime_original: null
  },
  video_info: null,
  content_info: {
    mime: { mime: 'image/png', type: 'image', subtype: 'png' },
    image: {
      dpi: null,
      width: 1248,
      format: 'PNG',
      height: 832,
      sequence: false,
      color_mode: 'RGB',
      orientation: null,
      geo_location: null,
      datetime_original: null
    }
  },
  is_ready: true,
  filename: 'generated.png',
  mime_type: 'image/png',
  metadata: {},
  status: 'success'
}

/** Every key, with its value's JSON type in place of the value. */
const shapeOf = (value: unknown): unknown => {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (typeof value !== 'object') return typeof value
  return Object.fromEntries(
    Object.entries(value).map(([key, inner]) => [key, shapeOf(inner)])
  )
}

it('answers a success frame shaped like the one production sent', async () => {
  const done = (
    await pollToEnd(
      await jobIdOf(await generate({ aspect_ratio: [3, 2], store: false }))
    )
  ).at(-1)
  const expected = shapeOf(PRODUCTION_SUCCESS_FRAME) as {
    image_info: { dpi: unknown }
    content_info: { image: { dpi: unknown } }
  }
  // The one known difference (see derivative.ts): production sent `dpi: null`.
  expected.image_info.dpi = 'array'
  expected.content_info.image.dpi = 'array'
  expect(shapeOf(done)).toEqual(expected)
  expect(done).toMatchObject({
    status: 'success',
    is_ready: true,
    is_stored: false,
    mime_type: 'image/png',
    image_info: { format: 'PNG' }
  })
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

it.each(['content_moderated', 'provider_unavailable'] as const)(
  'fails the job at poll time with the %s derivativeFailure preset',
  async (code) => {
    const session = resetSession().use('derivativeFailure', { code })
    const files = session.files.size
    const jobId = await jobIdOf(await generate())
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
    // Terminal: the next poll says the same, and no file was ever stored.
    expect(await (await status(jobId)).json()).toEqual(frames[1])
    expect(session.files.size).toBe(files)
  }
)

it('fails an edit job the same way', async () => {
  resetSession().use('derivativeFailure', { code: 'content_moderated' })
  const jobId = await jobIdOf(await edit())
  expect((await pollToEnd(jobId)).at(-1)).toMatchObject({
    status: 'error',
    error_code: 'content_moderated'
  })
})

it('leaves a job_id it never handed out to the route', async () => {
  resetSession().use('derivativeFailure', { code: 'content_moderated' })
  expect(await jsonError(await status('nope'))).toMatchObject({
    error_code: 'job_not_found'
  })
})

it('finishes a job on its first poll with the derivativesInstant preset', async () => {
  resetSession().use('derivativesInstant')
  const jobId = await jobIdOf(await generate())
  const frames = await pollToEnd(jobId)
  expect(frames).toHaveLength(1)
  expect(frames[0]).toMatchObject({
    status: 'success',
    is_ready: true,
    original_filename: 'generated.png'
  })
})

it('fails on the first poll when derivativesInstant is registered after derivativeFailure', async () => {
  resetSession()
    .use('derivativeFailure', { code: 'content_moderated' })
    .use('derivativesInstant')
  const jobId = await jobIdOf(await edit())
  expect(await pollToEnd(jobId)).toEqual([
    expect.objectContaining({
      status: 'error',
      error_code: 'content_moderated'
    })
  ])
})

it('reports processing first when derivativeFailure is registered after derivativesInstant', async () => {
  resetSession()
    .use('derivativesInstant')
    .use('derivativeFailure', { code: 'content_moderated' })
  const jobId = await jobIdOf(await generate())
  expect((await pollToEnd(jobId)).map((frame) => frame.status)).toEqual([
    'processing',
    'error'
  ])
})

it('refuses both job kinds with the derivativesDisabled preset', async () => {
  resetSession().use('derivativesDisabled')
  for (const send of [generate, edit])
    expect(await jsonError(await send())).toMatchObject({
      status_code: 403,
      error_code: 'derivative_disabled'
    })
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
    error_code: 'ProjectPublicKeyRequiredError',
    content: 'pub_key is required.'
  })
  expect(await jsonError(await status('nope', 'nope'))).toMatchObject({
    error_code: 'ProjectPublicKeyInvalidError'
  })
})

it('answers the throttle preset in the JSON envelope the client reads', async () => {
  resetSession().use('throttle', { match: 'POST /derivative/image/generate/' })
  expect(await jsonError(await generate())).toMatchObject({
    status_code: 429,
    error_code: 'RequestThrottledError'
  })
  await jobIdOf(await generate())
})

it('runs a signed-uploads project end to end on a Bearer token', async () => {
  resetSession().use('signedUploads')
  const authorization = `Bearer ${await mintAuthToken()}`
  expect(await jsonError(await generate())).toMatchObject({
    error_code: 'SignatureRequiredError'
  })

  const started = await post(
    '/derivative/image/generate/',
    {
      pub_key: 'demopublickey',
      prompt: 'a hat',
      aspect_ratio: [1, 1],
      filename: 'generated.png'
    },
    { authorization }
  )
  const jobId = await jobIdOf(started)
  const polled = await call(
    `${UPLOAD}/derivative/status/?pub_key=demopublickey&job_id=${jobId}`,
    { headers: { Accept: 'application/json', authorization } }
  )
  expect(await polled.json()).toEqual({ type: 'job', status: 'processing' })
})

it('scopes a Bearer token by the derivative path', async () => {
  const authorization = `Bearer ${token({
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

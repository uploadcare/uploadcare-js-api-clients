import { beforeEach, expect, it } from 'vitest'
import { resetSession } from '../src/index.js'
import { call, uploadFile } from './emulator.js'
import { assertMatchesSpec, jsonError, UNSPECIFIED_OPERATIONS } from './spec.js'
import uploadApiSpec from './specs/upload-api.json'

const upload = async () => {
  const response = await uploadFile({
    fields: { UPLOADCARE_STORE: 'auto' },
    query: '?jsonerrors=1'
  })
  const parsed = (await response.clone().json()) as { file: string }
  await assertMatchesSpec(response, { method: 'post', path: '/base/' })
  return parsed.file
}

beforeEach(() => resetSession())

it('answers /base/ with a body the spec accepts', async () => {
  await expect(upload()).resolves.toMatch(/^[0-9a-f-]{36}$/)
})

it('answers /info/ with every field the spec requires', async () => {
  const uuid = await upload()
  const response = await call(
    `https://upload.uploadcare.com/info/?jsonerrors=1&pub_key=demopublickey&file_id=${uuid}`
  )
  await assertMatchesSpec(response, { method: 'get', path: '/info/' })
})

it('uses a status code the spec documents when the file is unknown', async () => {
  const response = await call(
    'https://upload.uploadcare.com/info/?jsonerrors=1&pub_key=demopublickey&file_id=00000000-0000-4000-8000-000000000000'
  )
  // The HTTP status is 200 under `jsonerrors=1`; assertMatchesSpec validates
  // the status inside the envelope, which the spec documents.
  await assertMatchesSpec(response, { method: 'get', path: '/info/' })
})

it('answers an unknown file with the spec-declared sentence, jsonerrors=1', async () => {
  const response = await call(
    'https://upload.uploadcare.com/info/?jsonerrors=1&pub_key=demopublickey&file_id=00000000-0000-4000-8000-000000000000'
  )
  expect(await jsonError(response)).toMatchObject({
    status_code: 404,
    content: 'File is not found.'
  })
  await assertMatchesSpec(response, { method: 'get', path: '/info/' })
})

it('answers an unknown file with the bare spec sentence, no jsonerrors', async () => {
  const response = await call(
    'https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=00000000-0000-4000-8000-000000000000'
  )
  const body = await response.clone().text()
  expect(response.status).toBe(404)
  expect(response.headers.get('content-type')).toMatch(/^text\/plain/)
  expect(body).toBe('File is not found.')
  await assertMatchesSpec(response, { method: 'get', path: '/info/' })
})

it('rejects a /base/ upload with no file, jsonerrors=1', async () => {
  const form = new FormData()
  form.set('UPLOADCARE_PUB_KEY', 'demopublickey')
  const response = await call(
    'https://upload.uploadcare.com/base/?jsonerrors=1',
    {
      method: 'POST',
      body: form
    }
  )
  expect(await jsonError(response)).toMatchObject({
    status_code: 400,
    content: 'Request does not contain files.'
  })
  await assertMatchesSpec(response, { method: 'post', path: '/base/' })
})

it('rejects an /info/ 200 body missing a required field', async () => {
  const uuid = await upload()
  const response = await call(
    `https://upload.uploadcare.com/info/?jsonerrors=1&pub_key=demopublickey&file_id=${uuid}`
  )
  const body = (await response.clone().json()) as Record<string, unknown>
  delete body.is_image // one of the spec's 15 required fields

  await expect(
    assertMatchesSpec(response, { method: 'get', path: '/info/' }, body)
  ).rejects.toThrow()
})

it('rejects an /info/ 200 body with a required field of the wrong type', async () => {
  const uuid = await upload()
  const response = await call(
    `https://upload.uploadcare.com/info/?jsonerrors=1&pub_key=demopublickey&file_id=${uuid}`
  )
  const body = (await response.clone().json()) as Record<string, unknown>
  body.is_image = 'yes' // spec says boolean

  await expect(
    assertMatchesSpec(response, { method: 'get', path: '/info/' }, body)
  ).rejects.toThrow()
})

it('names the operation, the status, and the failing field when a body fails validation', async () => {
  const uuid = await upload()
  const response = await call(
    `https://upload.uploadcare.com/info/?jsonerrors=1&pub_key=demopublickey&file_id=${uuid}`
  )
  const body = (await response.clone().json()) as Record<string, unknown>
  delete body.is_image

  await expect(
    assertMatchesSpec(response, { method: 'get', path: '/info/' }, body)
  ).rejects.toThrow(/GET[\s\S]*\/info\/[\s\S]*200[\s\S]*is_image/)
})

it('rejects a /base/ upload with no file, no jsonerrors', async () => {
  const form = new FormData()
  form.set('UPLOADCARE_PUB_KEY', 'demopublickey')
  const response = await call('https://upload.uploadcare.com/base/', {
    method: 'POST',
    body: form
  })
  const body = await response.clone().text()
  expect(response.status).toBe(400)
  expect(response.headers.get('content-type')).toMatch(/^text\/plain/)
  expect(body).toBe('Request does not contain files.')
  await assertMatchesSpec(response, { method: 'post', path: '/base/' })
})

it('answers the JSON envelope for Accept: application/json, without jsonerrors', async () => {
  const response = await call(
    'https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=00000000-0000-4000-8000-000000000000',
    { headers: { Accept: 'application/json' } }
  )
  expect(await jsonError(response)).toMatchObject({
    status_code: 404,
    content: 'File is not found.'
  })
})

it('lets an explicit jsonerrors=0 win over Accept: application/json', async () => {
  const response = await call(
    'https://upload.uploadcare.com/info/?jsonerrors=0&pub_key=demopublickey&file_id=00000000-0000-4000-8000-000000000000',
    { headers: { Accept: 'application/json' } }
  )
  expect(response.status).toBe(404)
  expect(await response.text()).toBe('File is not found.')
})

it.each([...UNSPECIFIED_OPERATIONS])(
  'lists %s as unspecified only while the spec lacks it',
  (operation) => {
    const [method, path] = operation.split(' ') as [string, string]
    const paths = uploadApiSpec.paths as Record<string, Record<string, unknown>>
    expect(paths[path]?.[method.toLowerCase()]).toBeUndefined()
  }
)

it('refuses to validate an unspecified operation, naming why', async () => {
  await expect(
    assertMatchesSpec(Response.json({}), {
      method: 'get',
      path: '/derivative/status/'
    })
  ).rejects.toThrow(/UNSPECIFIED_OPERATIONS/)
})

/** A `jsonerrors=1` envelope for `POST /group/`, carrying `content`. */
const groupError = (content: string) =>
  assertMatchesSpec(Response.json({ error: { status_code: 400, content } }), {
    method: 'post',
    path: '/group/'
  })

it('accepts any value where a spec sentence has a %s placeholder', async () => {
  await expect(
    groupError('This is not valid file url: nope.')
  ).resolves.toBeUndefined()
})

it('still rejects a sentence that differs outside its placeholder', async () => {
  await expect(
    groupError('This is not a valid file url: nope.')
  ).rejects.toThrow(/is not one of the sentences the spec declares/)
})

it('accepts any value where a spec sentence has a <NAME> placeholder', async () => {
  await expect(
    assertMatchesSpec(
      Response.json({
        error: {
          status_code: 400,
          content:
            'File size can not be less than 10000000 bytes. Please use direct upload instead of multipart.'
        }
      }),
      { method: 'post', path: '/multipart/start/' }
    )
  ).resolves.toBeUndefined()
})

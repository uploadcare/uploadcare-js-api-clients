import { beforeEach, expect, it } from 'vitest'
import { handle, resetSession } from '../src/index.js'
import { assertMatchesSpec } from './spec.js'

// Long enough to decode as a real 1×1 JPEG (see base.test.ts) — needed so
// `image_info` comes back non-null, since the spec's `imageInfo` schema isn't
// nullable (see README.md).
const JPEG = new Uint8Array([
  0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0xff, 0xd9
])

const upload = async (name: string) => {
  const body = new FormData()
  body.set('UPLOADCARE_PUB_KEY', 'demopublickey')
  body.set('file', new File([JPEG], name, { type: 'image/jpeg' }))
  const response = await handle(
    new Request('https://upload.uploadcare.com/base/', { method: 'POST', body })
  )
  return ((await response!.json()) as { file: string }).file
}

// The brief's own snippet for this task built this request with no `pub_key`
// at all and expected a 200/400 rather than the 403 `requirePublicKey` would
// answer with — but `/group/` is a protected route in the old mock server
// (`mock-server/routes.ts`'s `isProtected: true`), and upload-client's own
// `group.test.ts` ("should be rejected with error code if failed") depends on
// that 403 actually firing. Fixed here to send one, like every other test file
// in this package does.
const createGroup = async (uuids: string[]) => {
  const body = new FormData()
  body.set('pub_key', 'secret_public_key')
  uuids.forEach((uuid, index) => body.set(`files[${index}]`, uuid))
  return (await handle(
    new Request('https://upload.uploadcare.com/group/?jsonerrors=1', {
      method: 'POST',
      body
    })
  ))!
}

beforeEach(() => resetSession())

it('builds a group out of files it holds', async () => {
  const uuids = [await upload('a.jpg'), await upload('b.jpg')]
  const response = await createGroup(uuids)
  const group = (await response.clone().json()) as {
    id: string
    files_count: number
  }
  await assertMatchesSpec({
    method: 'post',
    path: '/group/',
    status: 200,
    response,
    body: group
  })

  expect(group.id).toMatch(/~2$/)
  expect(group.files_count).toBe(2)

  const info = await handle(
    new Request(
      `https://upload.uploadcare.com/group/info/?pub_key=secret_public_key&group_id=${group.id}&jsonerrors=1`
    )
  )
  const infoBody = await info!.clone().json()
  expect(infoBody).toMatchObject({ id: group.id, files_count: 2 })
  await assertMatchesSpec({
    method: 'get',
    path: '/group/info/',
    status: 200,
    response: info!,
    body: infoBody
  })
})

it('refuses a group containing a file nobody uploaded', async () => {
  const response = await createGroup([await upload('a.jpg'), 'not-a-real-uuid'])
  expect(response.status).toBe(400)
})

it('refuses a group with a non-string files[N] entry, rather than dropping it', async () => {
  const uuid = await upload('a.jpg')
  const body = new FormData()
  body.set('pub_key', 'secret_public_key')
  body.set('files[0]', uuid)
  body.set('files[1]', new File([new Uint8Array()], 'not-a-uuid.txt'))
  const response = await handle(
    new Request('https://upload.uploadcare.com/group/?jsonerrors=1', {
      method: 'POST',
      body
    })
  )
  expect(response!.status).toBe(400)
  const parsed = await response!.json()
  expect(parsed).toMatchObject({
    error: { content: 'This is not valid file url: [object File].' }
  })
  expect(parsed).not.toHaveProperty('id')
})

it('builds a group out of a CDN url with operations, keeping default_effects', async () => {
  const uuid = await upload('a.jpg')
  const response = await createGroup([`${uuid}/-/resize/x800/`])
  const group = (await response.json()) as {
    files: Array<{ uuid: string; default_effects: string }>
  }
  expect(group.files[0]).toMatchObject({
    uuid,
    default_effects: 'resize/x800/'
  })
})

it('accepts a member nobody actually uploaded, matching the old mock server', async () => {
  // `upload-client`'s `group.test.ts` ("should create group of files") and
  // `uploadFileGroup/groupFromUploaded.test.ts` group hardcoded uuids no test
  // ever uploads first — see the `stubFile` comment in `group.ts`.
  const wellFormedButUnknown = '392e3aa3-5ed6-4ad6-a67e-b3a7c1d5b9e9'
  const response = await createGroup([wellFormedButUnknown])
  expect(response.status).toBe(200)
  const group = (await response.json()) as {
    files: Array<{ uuid: string }>
  }
  expect(group.files[0].uuid).toBe(wellFormedButUnknown)
})

it('fails every time for the "files not found" key, regardless of membership', async () => {
  const body = new FormData()
  body.set('pub_key', 'demopublickey')
  body.set('files[0]', await upload('a.jpg'))
  const response = await handle(
    new Request('https://upload.uploadcare.com/group/?jsonerrors=1', {
      method: 'POST',
      body
    })
  )
  expect(response!.status).toBe(400)
  expect(await response!.json()).toMatchObject({
    error: { content: 'Some files not found.' }
  })
})

it('refuses a request with no pub_key', async () => {
  const body = new FormData()
  body.set('files[0]', 'anything')
  const response = await handle(
    new Request('https://upload.uploadcare.com/group/?jsonerrors=1', {
      method: 'POST',
      body
    })
  )
  expect(response!.status).toBe(403)
})

it('refuses a request with no files[N] parameters', async () => {
  const body = new FormData()
  body.set('pub_key', 'secret_public_key')
  const response = await handle(
    new Request('https://upload.uploadcare.com/group/?jsonerrors=1', {
      method: 'POST',
      body
    })
  )
  expect(response!.status).toBe(400)
  expect(await response!.json()).toMatchObject({
    error: { content: 'No files[N] parameters found.' }
  })
})

it('reports a 404 for a group nobody created', async () => {
  const response = await handle(
    new Request(
      'https://upload.uploadcare.com/group/info/?pub_key=secret_public_key&group_id=not-a-real-group&jsonerrors=1'
    )
  )
  expect(response!.status).toBe(404)
  expect(await response!.json()).toMatchObject({
    error: { content: 'group_id is invalid.' }
  })
})

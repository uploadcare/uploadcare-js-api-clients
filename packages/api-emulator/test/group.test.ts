import { beforeEach, expect, it } from 'vitest'
import { handle, resetSession } from '../src/index.js'
import { assertMatchesSpec, jsonError } from './spec.js'

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

// `/group/` requires `pub_key` (403 otherwise); upload-client's `group.test.ts`
// ("should be rejected with error code if failed") relies on that 403.
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
    cdn_url: string
    url: string
    datetime_created: string
    datetime_stored: string | null
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
  // Asserted here rather than left to `assertMatchesSpec`: the spec's
  // `groupInfo` schema declares no `required`, so it accepts `{}` and would
  // not notice any of these four going missing. See `VACUOUS_SCHEMAS` in
  // `test/spec.ts`.
  expect(group.cdn_url).toBe(`https://ucarecdn.com/${group.id}/`)
  expect(group.url).toBe(`https://api.uploadcare.com/groups/${group.id}/`)
  expect(group.datetime_created).toBe(new Date(0).toISOString())
  expect(group.datetime_stored).toBeNull()

  const info = await handle(
    new Request(
      `https://upload.uploadcare.com/group/info/?pub_key=secret_public_key&group_id=${group.id}&jsonerrors=1`
    )
  )
  const infoBody = await info!.clone().json()
  expect(infoBody).toMatchObject({
    id: group.id,
    files_count: 2,
    cdn_url: group.cdn_url,
    url: group.url,
    datetime_created: group.datetime_created,
    datetime_stored: null
  })
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
  expect((await jsonError(response)).status_code).toBe(400)
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
  expect((await jsonError(response!)).status_code).toBe(400)
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

it('refuses a well-formed member nobody uploaded', async () => {
  const response = await createGroup(['00000000-0000-4000-8000-000000000000'])
  expect(await jsonError(response)).toMatchObject({
    status_code: 400,
    content: 'Some files not found.'
  })
})

it('stands in for STUB_GROUP_MEMBER, which upload-client groups unuploaded', async () => {
  const response = await createGroup(['392e3aa3-5ed6-4ad6-a67e-b3a7c1d5b9e9'])
  expect(response.status).toBe(200)
  const group = (await response.json()) as {
    files: Array<{ uuid: string }>
  }
  expect(group.files[0].uuid).toBe('392e3aa3-5ed6-4ad6-a67e-b3a7c1d5b9e9')
})

it('fails for the "files not found" key when the member was never uploaded', async () => {
  // Unlike the STUB_GROUP_MEMBER test above, under an ordinary key:
  // `demopublickey` must surface even the stub as "not found"
  // (`upload-client`'s own `group.test.ts` depends on this).
  const body = new FormData()
  body.set('pub_key', 'demopublickey')
  body.set('files[0]', '392e3aa3-5ed6-4ad6-a67e-b3a7c1d5b9e9')
  const response = await handle(
    new Request('https://upload.uploadcare.com/group/?jsonerrors=1', {
      method: 'POST',
      body
    })
  )
  expect(await jsonError(response!)).toMatchObject({
    status_code: 400,
    content: 'Some files not found.'
  })
})

it('groups a real upload under the "files not found" key by bare uuid, unlike the stub case above', async () => {
  // `demopublickey` is the public key file-uploader's e2e suite uses for real
  // uploads, so the member existence check must key off whether the file is
  // in the session, not off the public key alone.
  const uuid = await upload('a.jpg')
  const body = new FormData()
  body.set('pub_key', 'demopublickey')
  body.set('files[0]', uuid)
  const response = await handle(
    new Request('https://upload.uploadcare.com/group/?jsonerrors=1', {
      method: 'POST',
      body
    })
  )
  expect(response!.status).toBe(200)
  const group = (await response!.json()) as {
    files: Array<{ uuid: string; original_filename: string }>
  }
  expect(group.files[0].uuid).toBe(uuid)
  expect(group.files[0].original_filename).toBe('a.jpg')
})

it('groups a real upload under the "files not found" key by CDN url', async () => {
  const uuid = await upload('b.jpg')
  const body = new FormData()
  body.set('pub_key', 'demopublickey')
  body.set('files[0]', `https://ucarecdn.com/${uuid}/`)
  const response = await handle(
    new Request('https://upload.uploadcare.com/group/?jsonerrors=1', {
      method: 'POST',
      body
    })
  )
  expect(response!.status).toBe(200)
  const group = (await response!.json()) as {
    files: Array<{ uuid: string; original_filename: string }>
  }
  expect(group.files[0].uuid).toBe(uuid)
  expect(group.files[0].original_filename).toBe('b.jpg')
})

it('accepts a CDN url member without a trailing slash', async () => {
  const uuid = await upload('c.jpg')
  const response = await createGroup([`https://ucarecdn.com/${uuid}`])
  const group = (await response.json()) as { files: Array<{ uuid: string }> }
  expect(group.files[0].uuid).toBe(uuid)
})

it('accepts a CDN url member carrying -/ effects', async () => {
  const uuid = await upload('d.jpg')
  const response = await createGroup([
    `https://ucarecdn.com/${uuid}/-/resize/x800/`
  ])
  const group = (await response.json()) as {
    files: Array<{ uuid: string; default_effects: string }>
  }
  expect(group.files[0]).toMatchObject({
    uuid,
    default_effects: 'resize/x800/'
  })
})

it('accepts a <uuid>~N group reference as a member', async () => {
  const uuid = await upload('e.jpg')
  const first = await createGroup([uuid])
  const firstGroup = (await first.json()) as { id: string }
  const response = await createGroup([firstGroup.id])
  expect(response.status).toBe(200)
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
  expect((await jsonError(response!)).status_code).toBe(403)
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
  expect(await jsonError(response!)).toMatchObject({
    status_code: 400,
    content: 'No files[N] parameters found.'
  })
})

it('reports a 404 for a group nobody created', async () => {
  const response = await handle(
    new Request(
      'https://upload.uploadcare.com/group/info/?pub_key=secret_public_key&group_id=not-a-real-group&jsonerrors=1'
    )
  )
  expect(await jsonError(response!)).toMatchObject({
    status_code: 404,
    content: 'group_id is invalid.'
  })
})

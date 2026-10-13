import { beforeEach, expect, it } from 'vitest'
import { resetSession } from '../src/index.js'
import { call, createGroup, upload } from './emulator.js'
import { assertMatchesSpec, jsonError } from './spec.js'

const GROUP_URL = 'https://upload.uploadcare.com/group/?jsonerrors=1'

beforeEach(() => resetSession())

it('builds a group out of files it holds', async () => {
  const uuids = [
    await upload({ name: 'a.jpg' }),
    await upload({ name: 'b.jpg' })
  ]
  const response = await createGroup(uuids)
  const group = (await response.clone().json()) as {
    id: string
    files_count: number
    cdn_url: string
    url: string
    datetime_created: string
    datetime_stored: string | null
  }
  await assertMatchesSpec(response, { method: 'post', path: '/group/' })

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

  const info = await call(
    `https://upload.uploadcare.com/group/info/?pub_key=demopublickey&group_id=${group.id}&jsonerrors=1`
  )
  const infoBody = await info.clone().json()
  expect(infoBody).toMatchObject({
    id: group.id,
    files_count: 2,
    cdn_url: group.cdn_url,
    url: group.url,
    datetime_created: group.datetime_created,
    datetime_stored: null
  })
  await assertMatchesSpec(info, { method: 'get', path: '/group/info/' })
})

it('refuses a group containing a file nobody uploaded', async () => {
  const response = await createGroup([await upload(), 'not-a-real-uuid'])
  expect((await jsonError(response)).status_code).toBe(400)
})

it('refuses a group with a non-string files[N] entry, rather than dropping it', async () => {
  const uuid = await upload()
  const body = new FormData()
  body.set('pub_key', 'demopublickey')
  body.set('files[0]', uuid)
  body.set('files[1]', new File([new Uint8Array()], 'not-a-uuid.txt'))
  const response = await call(GROUP_URL, { method: 'POST', body })
  expect((await jsonError(response)).status_code).toBe(400)
  const parsed = await response.json()
  expect(parsed).toMatchObject({
    error: { content: 'This is not valid file url: [object File].' }
  })
  expect(parsed).not.toHaveProperty('id')
})

it('builds a group out of a CDN url with operations, keeping default_effects', async () => {
  const uuid = await upload()
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

it('groups a real upload by bare uuid', async () => {
  const uuid = await upload()
  const response = await createGroup([uuid])
  expect(response.status).toBe(200)
  const group = (await response.json()) as {
    files: Array<{ uuid: string; original_filename: string }>
  }
  expect(group.files[0].uuid).toBe(uuid)
  expect(group.files[0].original_filename).toBe('a.jpg')
})

it('groups a real upload by CDN url', async () => {
  const uuid = await upload({ name: 'b.jpg' })
  const response = await createGroup([`https://ucarecdn.com/${uuid}/`])
  expect(response.status).toBe(200)
  const group = (await response.json()) as {
    files: Array<{ uuid: string; original_filename: string }>
  }
  expect(group.files[0].uuid).toBe(uuid)
  expect(group.files[0].original_filename).toBe('b.jpg')
})

it('accepts a CDN url member without a trailing slash', async () => {
  const uuid = await upload()
  const response = await createGroup([`https://ucarecdn.com/${uuid}`])
  const group = (await response.json()) as { files: Array<{ uuid: string }> }
  expect(group.files[0].uuid).toBe(uuid)
})

it('accepts a CDN url member carrying -/ effects', async () => {
  const uuid = await upload()
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
  const uuid = await upload()
  const first = await createGroup([uuid])
  const firstGroup = (await first.json()) as { id: string }
  const response = await createGroup([firstGroup.id], {
    // The member reports as `stubFile` (group.ts): its uuid is the group id,
    // not a uuid, and it has no image_info. The real API's answer for a
    // group-of-groups isn't known, so the emulator doesn't pretend to model it.
    offSpec: 'a group reference member reports as a stub file'
  })
  expect(response.status).toBe(200)
})

it('refuses a request with no pub_key', async () => {
  // upload-client's `group.test.ts` ("should be rejected with error code if
  // failed") relies on this 403.
  const body = new FormData()
  body.set('files[0]', 'anything')
  const response = await call(GROUP_URL, { method: 'POST', body })
  expect((await jsonError(response)).status_code).toBe(403)
})

it('refuses a request with no files[N] parameters', async () => {
  const body = new FormData()
  body.set('pub_key', 'demopublickey')
  const response = await call(GROUP_URL, { method: 'POST', body })
  expect(await jsonError(response)).toMatchObject({
    status_code: 400,
    content: 'No files[N] parameters found.'
  })
})

it('reports a 404 for a group nobody created', async () => {
  const response = await call(
    'https://upload.uploadcare.com/group/info/?pub_key=demopublickey&group_id=not-a-real-group&jsonerrors=1'
  )
  expect(await jsonError(response)).toMatchObject({
    status_code: 404,
    content: 'group_id is invalid.'
  })
})

import { expect, it } from 'vitest'
import { handle, resetSession, SESSION_HEADER } from '../src/index.js'

/**
 * Nothing else in this package sets `SESSION_HEADER`, so nothing else would
 * notice if session scoping quietly collapsed into one shared store — which is
 * the whole reason the store is keyed at all (see `src/state/store.ts`).
 */
const JPEG = new Uint8Array([
  0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0xff, 0xd9
])

const request = (url: string, session: string, init?: RequestInit) =>
  handle(
    new Request(url, {
      ...init,
      headers: { ...(init?.headers as object), [SESSION_HEADER]: session }
    })
  )

const infoUrl = (uuid: string) =>
  `https://upload.uploadcare.com/info/?pub_key=secret_public_key&file_id=${uuid}`

const upload = async (session: string, name: string) => {
  const body = new FormData()
  body.set('UPLOADCARE_PUB_KEY', 'secret_public_key')
  body.set('file', new File([JPEG], name, { type: 'image/jpeg' }))
  const response = await request(
    'https://upload.uploadcare.com/base/',
    session,
    { method: 'POST', body }
  )
  return ((await response!.json()) as { file: string }).file
}

it('keeps two sessions from seeing each other', async () => {
  resetSession('alpha')
  resetSession('beta')

  // The `issued` counter, which mints uuids, restarts per session — so the
  // first upload into each gets the *same* uuid. That's the point: two stores,
  // not one store with two names.
  const alphaFile = await upload('alpha', 'alpha.jpg')
  const betaFile = await upload('beta', 'beta.jpg')
  expect(alphaFile).toBe(betaFile)

  const nameOf = async (uuid: string, session: string) => {
    const response = (await request(infoUrl(uuid), session))!
    expect(response.status).toBe(200)
    return ((await response.json()) as { original_filename: string })
      .original_filename
  }
  // Same uuid, two different files.
  expect(await nameOf(alphaFile, 'alpha')).toBe('alpha.jpg')
  expect(await nameOf(betaFile, 'beta')).toBe('beta.jpg')

  // A second upload into alpha alone: beta's counter never moved, so beta has
  // nothing at that uuid at all.
  const alphaSecond = await upload('alpha', 'alpha-2.jpg')
  expect(alphaSecond).not.toBe(alphaFile)
  expect((await request(infoUrl(alphaSecond), 'alpha'))!.status).toBe(200)
  expect((await request(infoUrl(alphaSecond), 'beta'))!.status).toBe(404)

  // Groups.
  const groupBody = new FormData()
  groupBody.set('pub_key', 'secret_public_key')
  groupBody.set('files[0]', alphaFile)
  const group = (await (await request(
    'https://upload.uploadcare.com/group/',
    'alpha',
    { method: 'POST', body: groupBody }
  ))!.json()) as { id: string }

  const groupUrl = `https://upload.uploadcare.com/group/info/?pub_key=secret_public_key&group_id=${group.id}`
  expect((await request(groupUrl, 'alpha'))!.status).toBe(200)
  expect((await request(groupUrl, 'beta'))!.status).toBe(404)

  // `from_url` jobs.
  const { token } = (await (await request(
    `https://upload.uploadcare.com/from_url/?pub_key=secret_public_key&source_url=${encodeURIComponent('https://images.unsplash.com/photo-1?dl=x.jpg')}`,
    'alpha',
    { method: 'POST' }
  ))!.json()) as { token: string }

  const statusUrl = `https://upload.uploadcare.com/from_url/status/?token=${token}`
  expect(await (await request(statusUrl, 'beta'))!.json()).toEqual({
    status: 'unknown'
  })
  expect(await (await request(statusUrl, 'alpha'))!.json()).toMatchObject({
    status: 'progress'
  })
})

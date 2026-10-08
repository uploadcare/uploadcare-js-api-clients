import { expect, it } from 'vitest'
import {
  ADAPTIVE_IMAGE_UUID,
  BUNDLE_IMAGE_UUID,
  DEMO_FILES,
  DEMO_IMAGE_UUID,
  EDITOR_IMAGE_UUID,
  resetSession
} from '../src/index.js'
import { call, createGroup, upload } from './emulator.js'

/**
 * Nothing else in this package sets `SESSION_HEADER`, so nothing else would
 * notice if session scoping quietly collapsed into one shared store — which is
 * the whole reason the store is keyed at all (see `src/state/store.ts`).
 */

const infoUrl = (uuid: string) =>
  `https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=${uuid}`

const statusOf = async (url: string, session: string) =>
  (await call(url, undefined, { session })).status

it('keeps two sessions from seeing each other', async () => {
  resetSession('alpha')
  resetSession('beta')

  // The `issued` counter, which mints uuids, restarts per session — so the
  // first upload into each gets the *same* uuid. That's the point: two stores,
  // not one store with two names.
  const alphaFile = await upload({ name: 'alpha.jpg', session: 'alpha' })
  const betaFile = await upload({ name: 'beta.jpg', session: 'beta' })
  expect(alphaFile).toBe(betaFile)

  const nameOf = async (uuid: string, session: string) => {
    const response = await call(infoUrl(uuid), undefined, { session })
    expect(response.status).toBe(200)
    return ((await response.json()) as { original_filename: string })
      .original_filename
  }
  // Same uuid, two different files.
  expect(await nameOf(alphaFile, 'alpha')).toBe('alpha.jpg')
  expect(await nameOf(betaFile, 'beta')).toBe('beta.jpg')

  // A second upload into alpha alone: beta's counter never moved, so beta has
  // nothing at that uuid at all.
  const alphaSecond = await upload({ name: 'alpha-2.jpg', session: 'alpha' })
  expect(alphaSecond).not.toBe(alphaFile)
  expect(await statusOf(infoUrl(alphaSecond), 'alpha')).toBe(200)
  expect(await statusOf(infoUrl(alphaSecond), 'beta')).toBe(404)

  // Groups.
  const group = (await (
    await createGroup([alphaFile], { session: 'alpha' })
  ).json()) as { id: string }

  const groupUrl = `https://upload.uploadcare.com/group/info/?pub_key=demopublickey&group_id=${group.id}`
  expect(await statusOf(groupUrl, 'alpha')).toBe(200)
  expect(await statusOf(groupUrl, 'beta')).toBe(404)

  // `from_url` jobs.
  const { token } = (await (
    await call(
      `https://upload.uploadcare.com/from_url/?pub_key=demopublickey&source_url=${encodeURIComponent('https://images.unsplash.com/photo-1?dl=x.jpg')}`,
      { method: 'POST' },
      { session: 'alpha' }
    )
  ).json()) as { token: string }

  const statusUrl = `https://upload.uploadcare.com/from_url/status/?token=${token}`
  expect(
    await (await call(statusUrl, undefined, { session: 'beta' })).json()
  ).toEqual({
    status: 'unknown'
  })
  expect(
    await (await call(statusUrl, undefined, { session: 'alpha' })).json()
  ).toMatchObject({
    status: 'progress'
  })
})

it('starts every session with the named demo files, which are all of DEMO_FILES', async () => {
  resetSession('fresh')
  // The uuids are the real demo project's: consumers hardcode them, so a
  // changed value is a breaking change, not a refactor.
  const named = {
    DEMO_IMAGE_UUID: '49b4c5a1-31b3-4349-ba07-d97a2d883c37',
    ADAPTIVE_IMAGE_UUID: '7124ae98-344c-42b2-ae2a-bd9aa79d76d8',
    EDITOR_IMAGE_UUID: 'f4dc9ebc-ed6d-4b4d-83d1-863bf1e4bb7f',
    BUNDLE_IMAGE_UUID: '90e06e59-8055-4435-9291-c005a98cf098'
  }
  expect({
    DEMO_IMAGE_UUID,
    ADAPTIVE_IMAGE_UUID,
    EDITOR_IMAGE_UUID,
    BUNDLE_IMAGE_UUID
  }).toEqual(named)
  expect(DEMO_FILES).toEqual(Object.values(named))
  for (const uuid of DEMO_FILES)
    expect(await statusOf(infoUrl(uuid), 'fresh')).toBe(200)
})

import { expect, it } from 'vitest'
import { resetSession } from '../src/index.js'
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

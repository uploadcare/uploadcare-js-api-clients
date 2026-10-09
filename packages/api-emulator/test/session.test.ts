import { beforeEach, expect, it } from 'vitest'
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

const readIn = async (url: string, session: string) => {
  const response = await call(url, undefined, { session })
  const isJson = response.headers.get('content-type')?.includes('json')
  return {
    status: response.status,
    body: isJson ? await response.json() : await response.text()
  }
}

beforeEach(() => {
  resetSession('alpha')
  resetSession('beta')
})

it('mints the same first uuid in two sessions, each with its own file behind it', async () => {
  // The `issued` counter, which mints uuids, restarts per session — so the
  // first upload into each gets the *same* uuid. That's the point: two stores,
  // not one store with two names.
  const alphaFile = await upload({ name: 'alpha.jpg', session: 'alpha' })
  const betaFile = await upload({ name: 'beta.jpg', session: 'beta' })
  expect(alphaFile).toBe(betaFile)

  expect(await readIn(infoUrl(alphaFile), 'alpha')).toMatchObject({
    status: 200,
    body: { original_filename: 'alpha.jpg' }
  })
  expect(await readIn(infoUrl(betaFile), 'beta')).toMatchObject({
    status: 200,
    body: { original_filename: 'beta.jpg' }
  })
})

it.each([
  {
    kind: 'a file',
    create: async () => infoUrl(await upload({ session: 'alpha' })),
    inAlpha: { status: 200, body: { original_filename: 'a.jpg' } },
    inBeta: { status: 404 }
  },
  {
    kind: 'a group',
    create: async () => {
      const file = await upload({ session: 'alpha' })
      const { id } = (await (
        await createGroup([file], { session: 'alpha' })
      ).json()) as { id: string }
      return `https://upload.uploadcare.com/group/info/?pub_key=demopublickey&group_id=${id}`
    },
    inAlpha: { status: 200, body: { files_count: 1 } },
    inBeta: { status: 404 }
  },
  {
    kind: 'a from_url job',
    create: async () => {
      const { token } = (await (
        await call(
          `https://upload.uploadcare.com/from_url/?pub_key=demopublickey&source_url=${encodeURIComponent('https://images.unsplash.com/photo-1?dl=x.jpg')}`,
          { method: 'POST' },
          { session: 'alpha' }
        )
      ).json()) as { token: string }
      return `https://upload.uploadcare.com/from_url/status/?token=${token}`
    },
    inAlpha: { status: 200, body: { status: 'progress' } },
    // /from_url/status/ answers an unknown token with 200, not 404.
    inBeta: { status: 200, body: { status: 'unknown' } }
  }
])(
  'keeps $kind made in one session out of another',
  async ({ create, inAlpha, inBeta }) => {
    const url = await create()

    expect(await readIn(url, 'beta')).toMatchObject(inBeta)
    expect(await readIn(url, 'alpha')).toMatchObject(inAlpha)
  }
)

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
    expect(await readIn(infoUrl(uuid), 'fresh')).toMatchObject({
      status: 200,
      body: { uuid }
    })
})

import { expect, it } from 'vitest'
import { createFetch, resetSession, sessionOf } from '../src/index.js'
import { call } from './emulator.js'

const EVENTS_URL = 'https://tlm.uploadcare.com/api/v1/events'
const INFO_URL =
  'https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=x'

it('logs every request a session received, in order, bodies readable', async () => {
  const session = resetSession('requests-order')
  await call(
    EVENTS_URL,
    { method: 'POST', body: '{"n":1}' },
    {
      session: 'requests-order'
    }
  )
  await createFetch({ session: 'requests-order' })(INFO_URL)

  expect(
    session.requests.map((request) => [request.method, request.url])
  ).toEqual([
    ['POST', EVENTS_URL],
    ['GET', INFO_URL]
  ])
  expect(await session.requests[0].json()).toEqual({ n: 1 })
})

it('logs a request nothing answers, and one a scenario answers', async () => {
  const session = resetSession('requests-scenario')
  session.on('GET /info/', () => new Response('{}'))
  await createFetch({ session: 'requests-scenario' })(INFO_URL)
  await expect(
    createFetch({ session: 'requests-scenario' })(
      'https://upload.uploadcare.com/nope/'
    )
  ).rejects.toThrow(TypeError)

  expect(session.requests.map((request) => request.url)).toEqual([
    INFO_URL,
    'https://upload.uploadcare.com/nope/'
  ])
})

it('keeps each session’s log to itself, and the handle reads sessionOf’s', async () => {
  const alpha = resetSession('requests-alpha')
  const beta = resetSession('requests-beta')
  await createFetch({ session: 'requests-alpha' })(INFO_URL)

  expect(alpha.requests).toHaveLength(1)
  expect(beta.requests).toEqual([])
  expect(sessionOf(alpha.requests[0]).requests).toBe(alpha.requests)
})

it('is cleared by resetSession(), on a handle taken before the reset too', async () => {
  const session = resetSession('requests-reset')
  await createFetch({ session: 'requests-reset' })(INFO_URL)
  expect(session.requests).toHaveLength(1)

  resetSession('requests-reset')
  expect(session.requests).toEqual([])
})

import { expect, it } from 'vitest'
import { createFetch, resetSession } from '../src/index.js'

const EVENTS_URL = 'https://tlm.uploadcare.com/api/v1/events'
const INFO_URL =
  'https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id='

it('answers like handle(), with fetch’s (input, init) signature', async () => {
  const response = await createFetch()(EVENTS_URL, {
    method: 'POST',
    body: '{}'
  })
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({})
})

it('takes a Request and a URL as input too', async () => {
  const fetch = createFetch()
  expect(
    (await fetch(new Request(EVENTS_URL, { method: 'POST', body: '{}' })))
      .status
  ).toBe(200)
  expect((await fetch(new URL(EVENTS_URL), { method: 'POST' })).status).toBe(
    200
  )
})

it('sends to the session it was made for', async () => {
  const session = resetSession('create-fetch')
  const other = resetSession('create-fetch-other')
  await createFetch({ session: 'create-fetch' })(EVENTS_URL, {
    method: 'POST',
    body: JSON.stringify({ event_type: 'mine' })
  })
  expect(session.telemetry).toEqual([{ event_type: 'mine' }])
  expect(other.telemetry).toEqual([])
})

it('sends to the default session without one', async () => {
  const session = resetSession()
  await createFetch()(EVENTS_URL, {
    method: 'POST',
    body: JSON.stringify({ event_type: 'default' })
  })
  expect(session.telemetry).toEqual([{ event_type: 'default' }])
})

it('rejects with the reason of an already-aborted signal, like fetch', async () => {
  const session = resetSession()
  const controller = new AbortController()
  const reason = new Error('gone')
  controller.abort(reason)
  await expect(
    createFetch()(EVENTS_URL, {
      method: 'POST',
      body: '{}',
      signal: controller.signal
    })
  ).rejects.toBe(reason)
  expect(session.telemetry).toEqual([])
})

it('rejects with a TypeError naming the request when no route answers', async () => {
  await expect(
    createFetch()('https://upload.uploadcare.com/nope/', { method: 'PUT' })
  ).rejects.toThrow(
    new TypeError(
      '@uploadcare/api-emulator does not implement PUT https://upload.uploadcare.com/nope/'
    )
  )
})

it('rejects with a TypeError on a dropped connection, like fetch', async () => {
  const session = resetSession('create-fetch-drop')
  session.on('GET /info/', () => Response.error())
  await expect(
    createFetch({ session: 'create-fetch-drop' })(`${INFO_URL}x`)
  ).rejects.toThrow(TypeError)
})

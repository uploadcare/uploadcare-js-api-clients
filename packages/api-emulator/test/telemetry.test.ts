import { expect, it } from 'vitest'
import { handle, resetSession, SESSION_HEADER } from '../src/index.js'

const EVENTS_URL = 'https://tlm.uploadcare.com/api/v1/events'

const post = (body: unknown, session = 'telemetry') =>
  handle(
    new Request(EVENTS_URL, {
      method: 'POST',
      headers: { [SESSION_HEADER]: session },
      body: JSON.stringify(body)
    })
  )

it('answers {} at 200, like the stub it replaces', async () => {
  const response = (await post({ event_type: 'lifecycle' }))!
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({})
})

it('records posted bodies verbatim, in arrival order, per session', async () => {
  const session = resetSession('telemetry-order')
  await post({ event_type: 'first' }, 'telemetry-order')
  await post({ event_type: 'second', extra: [1, 2] }, 'telemetry-order')

  expect(session.telemetry).toEqual([
    { event_type: 'first' },
    { event_type: 'second', extra: [1, 2] }
  ])
})

it('keeps two sessions from seeing each other', async () => {
  const alpha = resetSession('telemetry-alpha')
  const beta = resetSession('telemetry-beta')
  await post({ event_type: 'alpha-event' }, 'telemetry-alpha')

  expect(alpha.telemetry).toEqual([{ event_type: 'alpha-event' }])
  expect(beta.telemetry).toEqual([])
})

it('does not reject an unexpected shape', async () => {
  const response = (await post('not-an-object'))!
  expect(response.status).toBe(200)
  const response2 = (await post([1, 2, 3]))!
  expect(response2.status).toBe(200)
})

it("resetSession clears a session's telemetry", async () => {
  const session = resetSession('telemetry-reset')
  await post({ event_type: 'lifecycle' }, 'telemetry-reset')
  expect(session.telemetry).toHaveLength(1)

  const restarted = resetSession('telemetry-reset')
  expect(restarted.telemetry).toEqual([])
})

it("the CDN's /:uuid/* pattern never swallows /api/v1/events", async () => {
  const response = (await post({ event_type: 'lifecycle' }, 'telemetry-cdn'))!
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({})

  const session = resetSession('telemetry-cdn')
  expect(session.telemetry).toEqual([])
})

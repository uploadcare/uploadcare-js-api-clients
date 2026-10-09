import { beforeEach, expect, it } from 'vitest'
import { resetSession, sessionOf } from '../src/index.js'
import { call as emulatorCall, upload } from './emulator.js'

/**
 * `session.on()`: the per-test scenario chain in front of the emulator's own
 * routes. Presets (`session.use()`) have their own file, presets.test.ts.
 */

/** `call`, unchecked against the spec: each test answers with its own scenario. */
const call = (...[input, init, options]: Parameters<typeof emulatorCall>) =>
  emulatorCall(input, init, {
    offSpec: "a scenario answers in the route's place",
    ...options
  })

const INFO =
  'https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=nope'

let session: ReturnType<typeof resetSession>
beforeEach(() => {
  session = resetSession()
})

it('answers a matching request with the scenario instead of the route', async () => {
  session.on('GET /info/', () => new Response('scenario'))
  expect(await (await call(INFO)).text()).toBe('scenario')
})

it('matches the path the way routes do: params, and no trailing slash needed', async () => {
  const seen: Record<string, string>[] = []
  session.on('PUT /multipart/upload/:uuid/original/', ({ params }) => {
    seen.push(params)
    return new Response('part')
  })
  const response = await call(
    'https://upload.uploadcare.com/multipart/upload/abc/original?partNumber=1',
    { method: 'PUT', body: 'x' }
  )
  expect(await response.text()).toBe('part')
  expect(seen).toEqual([{ uuid: 'abc' }])
})

it('leaves a request the match does not cover to the route', async () => {
  session.on('POST /info/', () => new Response('scenario'))
  session.on({ path: '/info/', host: 'example.com' }, () => new Response('x'))
  expect((await call(INFO)).status).toBe(404)
})

it('matches by method, path or host alone with the object form', async () => {
  session.on({ host: 'ucarecdn.com' }, () => new Response('cdn'))
  expect(await (await call('https://ucarecdn.com/anything/')).text()).toBe(
    'cdn'
  )
  expect((await call(INFO)).status).toBe(404)
})

it.each(['/info/', 'GET', 'GET info', 'GET /a/ /b/'])(
  'refuses the match string %j, which is not "METHOD /path"',
  (match) => {
    expect(() => session.on(match, () => undefined)).toThrow(TypeError)
  }
)

it('falls through when the handler answers undefined', async () => {
  session.on('GET /info/', () => undefined)
  expect((await call(INFO)).status).toBe(404)
})

it('runs the most recently registered scenario first', async () => {
  session
    .on('GET /info/', () => new Response('first'))
    .on('GET /info/', () => new Response('second'))
  expect(await (await call(INFO)).text()).toBe('second')
})

it('hands next() the rest of the chain: older scenarios, then the route, with its state changes applied', async () => {
  session.on('POST /base/', async ({ next }) => {
    const response = await next()
    const { file } = (await response!.json()) as { file: string }
    return Response.json({ file, wrapped: true })
  })
  const response = await call('https://upload.uploadcare.com/base/', {
    method: 'POST',
    body: (() => {
      const body = new FormData()
      body.set('UPLOADCARE_PUB_KEY', 'demopublickey')
      body.set('file', new File(['x'], 'a.txt'))
      return body
    })()
  })
  const { file, wrapped } = (await response.json()) as {
    file: string
    wrapped: boolean
  }
  expect(wrapped).toBe(true)
  expect(session.files.get(file)?.name).toBe('a.txt')

  session.on('GET /info/', () => new Response('older'))
  session.on('GET /info/', async ({ next }) => next())
  expect(await (await call(INFO)).text()).toBe('older')
})

it('does not run the rest of the chain twice when a handler calls next() and then falls through', async () => {
  const before = session.files.size
  session.on('POST /base/', async ({ next }) => {
    await next()
    return undefined
  })
  await upload()
  expect(session.files.size).toBe(before + 1)
})

it('runs the rest of the chain again on every next() call', async () => {
  let calls = 0
  session.on('GET /info/', () => new Response(String((calls += 1))))
  session.on('GET /info/', async ({ next }) => {
    await next()
    return next()
  })
  expect(await (await call(INFO)).text()).toBe('2')
})

it('lets the handler and the route each read the body', async () => {
  session.on('POST /base/', async ({ request, next }) => {
    expect((await request.formData()).get('UPLOADCARE_PUB_KEY')).toBe(
      'demopublickey'
    )
    return next()
  })
  expect(await upload()).toEqual(expect.any(String))
})

it('removes a scenario after `times` answers', async () => {
  session.on('GET /info/', () => new Response('once'), { times: 1 })
  expect(await (await call(INFO)).text()).toBe('once')
  expect((await call(INFO)).status).toBe(404)
})

it('does not count a fall-through against `times`', async () => {
  let answer = false
  session.on('GET /info/', () => (answer ? new Response('now') : undefined), {
    times: 1
  })
  expect((await call(INFO)).status).toBe(404)
  answer = true
  expect(await (await call(INFO)).text()).toBe('now')
  expect((await call(INFO)).status).toBe(404)
})

it('gives `times: 1` to one of two concurrent requests', async () => {
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  session.on(
    'GET /info/',
    async () => {
      await held
      return new Response('scenario')
    },
    { times: 1 }
  )
  const both = Promise.all([call(INFO), call(INFO)])
  release()
  const statuses = (await both)
    .map((response) => response.status)
    .toSorted((a, b) => a - b)
  expect(statuses).toEqual([200, 404])
})

it.each([0, -1, 1.5, Number.NaN])(
  'refuses times: %s, which is not a positive integer',
  (times) => {
    expect(() => session.on('GET /info/', () => undefined, { times })).toThrow(
      TypeError
    )
  }
)

it('passes the session handle to the handler', async () => {
  session.on('GET /info/', ({ session: seen }) =>
    Response.json({ same: seen === sessionOf(new Request(INFO)) })
  )
  expect(await (await call(INFO)).json()).toEqual({ same: true })
})

it('scopes scenarios to their session, and resetSession() clears them', async () => {
  session.on('GET /info/', () => new Response('scenario'))
  expect((await call(INFO, undefined, { session: 'other' })).status).toBe(404)

  resetSession()
  expect((await call(INFO)).status).toBe(404)
})

it('keeps the SessionView readable from the handle', async () => {
  const uuid = await upload()
  expect(session.files.get(uuid)?.name).toBe('a.jpg')
  expect(session.telemetry).toEqual([])
})

it('keeps a handle taken before a reset live: on() still steers, files are current', async () => {
  const uuid = await upload()
  resetSession()
  expect(session.files.has(uuid)).toBe(false)
  session.on('GET /info/', () => new Response(null, { status: 503 }))
  expect((await call(INFO)).status).toBe(503)
})

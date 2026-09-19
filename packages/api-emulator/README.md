# @uploadcare/api-emulator

An in-process, stateful emulator of the Uploadcare Upload API, for tests that
need real request/response round-trips without hitting the network.

## Browser-safe by design

`@uploadcare/api-emulator` (the `.` export: `handle`, `resetSession`,
`sessionOf`, `SESSION_HEADER`) runs anywhere `Request`/`Response` exist,
including inside a browser page — that's what lets it back an in-browser MSW
worker. `@uploadcare/api-emulator/listen` is Node-only: it speaks raw HTTP
sockets (`node:http`/`node:https`, `Buffer`) to give a suite a real origin to
point a `baseURL` at. The split exists so the core can be bundled into a page
without dragging Node built-ins with it; `test/browser-safe.test.ts` asserts
the `.` export's source never regresses that.

Three ways to run it, in increasing order of how "real" the transport needs
to be:

### 1. As a server

For tests that need a real origin — this is what `upload-client`'s suite
does, pointing its `baseURL`/`baseCDN` at the emulator instead of the real
API:

```ts
import { createEmulatorServer } from '@uploadcare/api-emulator/listen'

const { origin, close } = await createEmulatorServer({ port: 0, delayMs: 30 })
// point the client under test at `origin`, e.g.:
// new UploadClient({ baseURL: origin, baseCDN: origin })

await close()
```

### 2. As a function

`handle(request)` returns `Response | undefined`. `undefined` means "not an
endpoint this emulator implements," so the caller decides what happens next
— this is the shape Playwright's `page.route` wants. `handle` needs a real
WHATWG `Request`, not Playwright's own request object (its `.url` is a
method, not a string, and it has no `.headers`/`.arrayBuffer()` of the web
shape), so the route handler builds one first:

```ts
import { handle } from '@uploadcare/api-emulator'

await page.route(/^https?:\/\//, async (route) => {
  const request = route.request()
  const method = request.method()
  const body = method === 'GET' || method === 'HEAD' ? null : request.postDataBuffer()

  const response = await handle(
    new Request(request.url(), {
      method,
      headers: request.headers(),
      body: body && new Uint8Array(body)
    })
  )

  if (!response) return route.abort() // nothing the emulator implements
  await route.fulfill({
    status: response.status,
    headers: Object.fromEntries(response.headers),
    body: Buffer.from(await response.arrayBuffer())
  })
})
```

(The `Buffer` above is the caller's Node/Playwright code, not the emulator's
— the browser-safe guard only scans `src/`.)

### 3. With MSW, in Node or in the browser

One handler, delegating to `handle`, works for both `msw/node` and
`msw/browser` — `handle` returning `undefined` for a request it doesn't
implement is exactly what makes `passthrough()` the right fallback: it hands
the request back to whatever `setupServer`/`setupWorker` would otherwise have
done with it, instead of the emulator having an opinion about traffic that
isn't its own.

```ts
import { http, passthrough } from 'msw'
import { setupServer } from 'msw/node' // or: import { setupWorker } from 'msw/browser'
import { handle } from '@uploadcare/api-emulator'

const uploadcare = http.all('*', async ({ request }) => (await handle(request)) ?? passthrough())

const server = setupServer(uploadcare)
```

## Sessions

The emulator is stateful, and state is scoped to a *session* rather than
shared globally, so that a test suite running its files in parallel against
one emulator doesn't see one file's upload answered by another's. A fresh
session starts out empty — no files, no groups — as if nothing had ever been
uploaded to it.

- `resetSession(id?)` clears (or starts) a session. Call it between tests
  that share an emulator instance so each test starts from an empty store.
  With no `id`, it resets the `'default'` session.
- The `x-uploadcare-emulator-session` header (exported as `SESSION_HEADER`)
  names which session a request belongs to. Set it on every request from a
  given test file to keep that file's uploads isolated from every other file
  running against the same emulator at the same time. A request with no
  session header, or one nobody has reset yet, gets the `'default'` session,
  created on demand.

## What's implemented today

Only the Upload API's `POST /base/` (single-file upload) and `GET /info/`
(file metadata) endpoints exist right now. More endpoints — `from_url`,
groups, multipart, and the CDN — are on the way; this README will grow a
section for each as it lands rather than promising them ahead of time.

## The spec is the authority

Response shapes are validated in tests against Uploadcare's published Upload
API OpenAPI document, vendored at `test/specs/upload-api.json`. See
`test/spec.ts` for the validator and `test/spec.test.ts` for the contract
tests.

The snapshot is generated, never hand-edited:

```bash
# Refresh the vendored snapshot from a fresh presigned URL (get one from the
# "Download OpenAPI spec" link on https://uploadcare.com/docs/api/upload/):
npm run spec:refresh -- <presigned-url>

# Check whether the published spec has drifted from the committed snapshot,
# without writing anything:
npm run spec:check -- <presigned-url>
```

Both need network and a URL that's still valid — the download link is a
presigned S3 URL that expires after 7 days — so neither runs as part of
`npm test`, the build, or CI's default path. `test/specs/upload-api.meta.json`
records the `info.version`, a SHA-256 of the downloaded bytes, the date, and
the URL with its `X-Amz-*` signature parameters stripped.

Three things the spec doesn't model, which the validator accommodates rather
than "fixing" the emulator to match literally:

- The `/base/` success schema describes a `{ "<filename>": "<uuid>" }` map,
  because that's the real API's shape; the emulator answers `{ "file": "<uuid>" }`,
  which is what upload-client reads.
- `jsonerrors=1`, which upload-client sends on every request, isn't
  mentioned by the spec at all. Without it, error responses are the
  `text/plain` sentence the spec documents; with it, they're the JSON
  envelope upload-client expects, checked against the same sentences.
- `fileUploadInfo.image_info` isn't marked `nullable` in the spec, unlike its
  `video_info`/`content_info` siblings — but a non-image upload genuinely has
  no image info, and the emulator answers `null` for one, matching the real
  API. The `test/base.test.ts` test named `reports image_info: null for a
non-image upload` asserts that behaviour directly, deliberately without
  `assertMatchesSpec`, since the spec can't express it; the `/info/`
  round-trip test that goes through `assertMatchesSpec` uploads something
  `imageSize()` recognizes as an image instead.

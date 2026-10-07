# @uploadcare/api-emulator

An in-process, stateful emulator of the Uploadcare Upload API, for tests that
need real request/response round-trips without hitting the network.

## Browser-safe by design

`@uploadcare/api-emulator` (the `.` export: `handle`, `resetSession`,
`sessionOf`, `SESSION_HEADER`, `mintAuthToken` and the rest) runs anywhere `Request`/`Response` exist,
including inside a browser page — that's what lets it back an in-browser MSW
worker. `@uploadcare/api-emulator/listen` is Node-only: it speaks raw HTTP
sockets (`node:http`/`node:https`, `Buffer`) to give a suite a real origin to
point a `baseURL` at. `@uploadcare/api-emulator/browser` is page-only, and the
one export that needs MSW (see [3. In the browser](#3-in-the-browser-with-msw)).
The split exists so the core can be bundled into a page without dragging Node
built-ins with it, and used from Node without installing MSW;
`test/dist.test.ts` asserts the built `.` and `./browser` bundles don't regress
that, and that only `./browser` reaches MSW.

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

When the server is started lazily from somewhere with no teardown hook, call
`unref()` on the returned handle instead, so it doesn't keep the process
alive. A route that throws answers that one request `500` rather than taking
the process down, and a request no route handles answers `502`; both bodies are
fixed strings, with the method, path and error logged to the console.

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
  const body =
    method === 'GET' || method === 'HEAD' ? null : request.postDataBuffer()

  const response = await handle(
    new Request(request.url(), {
      method,
      headers: request.headers(),
      body: body && new Uint8Array(body)
    })
  )

  // Nothing the emulator implements, or a deliberate network error (which
  // `route.fulfill` can't send: it rejects status 0).
  if (!response || response.type === 'error') return route.abort()
  await route.fulfill({
    status: response.status,
    headers: Object.fromEntries(response.headers),
    body: Buffer.from(await response.arrayBuffer())
  })
})
```

(The `Buffer` above is the caller's Node/Playwright code, not the emulator's
— the browser-safe guard only scans `src/`.)

For code that takes an injectable `fetch`, `createFetch()` wraps `handle` in
`fetch`'s own signature: no server, no worker, no interceptor.

```ts
import { createFetch } from '@uploadcare/api-emulator'

const client = createApiClient({ fetch: createFetch({ session: 'my-suite' }) })
```

It behaves like `fetch` where a client can tell: it rejects with the signal's
reason when the signal is already aborted, and with a `TypeError` naming the
method and URL when no route answers it or a scenario drops the connection
(`Response.error()`). `session` is sent as `SESSION_HEADER` on every request;
without it, requests go to the `'default'` session.

### 3. In the browser, with MSW

`@uploadcare/api-emulator/browser` answers a page's Uploadcare traffic for a
browser-mode test suite (Vitest browser mode, for one). `msw` and
`@mswjs/interceptors` are optional peer dependencies: install them next to it.

```ts
import { setupEmulator } from '@uploadcare/api-emulator/browser'

const emulator = setupEmulator({ cdnHosts: ['cdn.example.com'] })

beforeEach(() => emulator.reset()) // starts it once, then a fresh session
afterAll(() => emulator.stop()) // optional

it('retries a throttled upload', async () => {
  const session = await emulator.reset()
  session.use('throttle', { match: 'POST /base/' })
  // ...
})
```

`reset()` answers the session's handle; see
[Per-test scenarios](#per-test-scenarios).

Two ways in, one state: an `XMLHttpRequestInterceptor` answers XHR (every
upload) in the page, so `xhr.upload` fires a `progress` event per body chunk,
and an MSW Service Worker answers `fetch` and resource loads like `<img>`,
which nothing in the page can reach. One emulator per page.

Where a request goes depends on its host, since `handle` routes by path alone:

- Uploadcare's hosts (`upload.uploadcare.com`, `ucarecdn.com`, `ucarecd.net`
  and its `<prefix>.ucarecd.net` subdomains, `tlm.uploadcare.com`) and any
  `cdnHosts` you pass are emulated. A path the emulator has no route for
  fails as a network error, with a `console.warn` naming the method and URL,
  rather than reaching the real API.
- Any other Uploadcare host (`api.uploadcare.com`, `<sub>.ucarecdn.com`, …)
  fails as a network error with a `console.error`, whatever `unhandled` says.
- The page's own origin (the dev server) always passes through.
- Any other origin follows `unhandled`. `'error'`, the default, fails it as a
  network error and names the URL in a `console.error`, so a new or mistyped
  endpoint can't quietly reach a real service. `'passthrough'` lets it out to
  the network, for a suite that does load something real (an image to import
  from a URL, say).

An emulated XHR is held back by one macrotask (`setTimeout(0)`) before it is
answered. Answered in the page, the whole request would otherwise be able to
complete within microtasks of `send()`, before a store that flushes on
`setTimeout(0)` (file-uploader's) has run, and its upload-start/progress
events would never fire. A real network can't answer that fast. `fetch` has
no upload events and gets no hold.

The worker script is `/mockServiceWorker.js`. `@vitest/browser` serves it from
`msw` itself, so a Vitest browser suite needs nothing else; anywhere else,
copy it into the public directory with `npx msw init <publicDir>`.

Per-chunk upload progress needs `@mswjs/interceptors` 0.45.7 or a later 0.45.x
(the peer range is `^0.45.7`), which is why it's a peer of its own: `msw` 2.15
depends on `^0.41`, a copy that fires a single upload `progress` event. Depend
on `@mswjs/interceptors` directly so your install resolves the 0.45 one.

For a different transport policy, or MSW in Node, skip `./browser` and
delegate to `handle` yourself — `undefined` from it is exactly what makes
`passthrough()` the right fallback:

```ts
import { http, passthrough } from 'msw'
import { setupServer } from 'msw/node'
import { handle } from '@uploadcare/api-emulator'

const server = setupServer(
  http.all('*', async ({ request }) => (await handle(request)) ?? passthrough())
)
```

## Sessions

The emulator is stateful, and state is scoped to a _session_ rather than
shared globally, so that a test suite running its files in parallel against
one emulator doesn't see one file's upload answered by another's. A fresh
session holds only the demo project's files (see [Demo-project files](#demo-project-files))
— no groups, no jobs, nothing uploaded.

- `resetSession(id?)` clears (or starts) a session, its scenarios included,
  and answers its handle (see [Per-test scenarios](#per-test-scenarios)).
  Call it between tests that share an emulator instance so each test starts
  from a fresh store. With no `id`, it resets the `'default'` session.
- The `x-uploadcare-emulator-session` header (exported as `SESSION_HEADER`)
  names which session a request belongs to. Set it on every request from a
  given test file to keep that file's uploads isolated from every other file
  running against the same emulator at the same time. A request with no
  session header gets the `'default'` session; a header naming a session
  nobody has reset yet gets a fresh session under that id, created on demand.
- The header picks the session on every request, in `./listen` server mode
  and under MSW alike, so within one module realm (one page under MSW, one
  process running `./listen`) different header values mean different
  sessions. Under MSW each page also has its own copy of the session map, so
  separate pages are isolated even when they send the same header value.
  `test/session.test.ts` pins the server-mode behaviour.

## What's implemented today

The Upload API's `POST /base/` (single-file upload), `GET /info/` (file
metadata), `POST /from_url/` / `GET /from_url/status/`, `POST /group/` /
`GET /group/info/`, and multipart upload (`POST /multipart/start/`, the part
`PUT`, `POST /multipart/complete/`) all exist today, and so does the CDN. A
part `PUT` carrying an `Authorization` header fails as a network error, as the
real presigned storage URL does.

So do the AI derivative endpoints, `POST /derivative/image/generate/`,
`POST /derivative/image/edit/` and `GET /derivative/status/`
(`src/apis/upload/derivative.ts`). **These are validated against their client,
not the OpenAPI spec**: the published document doesn't describe them, so they
are modelled on ai-image-editor's `UploadcareApiClient` (and its dev-only Zod
schemas) and listed in `UNSPECIFIED_OPERATIONS` (`test/spec.ts`);
`test/derivative.test.ts` asserts their shapes directly. In short:

- Both POSTs take a JSON body with `pub_key` (the query string works too),
  `prompt`, `filename`, `aspect_ratio` (`[w, h]`, positive integers; required
  for generate, optional for edit), optional `store` (`false` leaves the result
  unstored) and, for edit, `source` — the uuid of a file in the session, which
  must be an image. They answer `{ "type": "job", "job_id": "…" }`. The gate is
  every other protected route's: public key, Bearer token (scoped by the
  derivative path), and the `signedUploads` and `throttle` presets.
- Polling `GET /derivative/status/?pub_key=…&job_id=…` walks the job through
  `processing`, `uploading`, `success` with `is_ready: false`, then `success`
  with `is_ready: true` for good. The success frame is the `/info/` payload
  plus `status`: the result is a real stored file (the stock image under the
  requested `filename`), so `/info/` and the CDN serve it.
- Refusals are the JSON error envelope with a snake_case `error_code`:
  `invalid_request`, `invalid_aspect_ratio`, `source_not_found`,
  `source_not_image`, `derivative_disabled`, `job_id_required`,
  `job_not_found`. The client sends `Accept: application/json` instead of
  `jsonerrors=1`, so with no `jsonerrors` parameter that header alone asks
  for the envelope on every route; an explicit `jsonerrors` still wins.

## The CDN

`GET https://ucarecdn.com/<uuid>/...` and the per-project cnames under
`*.ucarecd.net` are served by `src/apis/cdn/index.ts`, matched on path alone
(the listening server already answers on its own host — there's no host to
tell projects apart by, unlike the browser suite's MSW handler this was
ported from). It answers three ways:

- A bare `/<uuid>/-/<any operations>/` delivers the bytes that were
  uploaded, whatever the operations ask for — no image codec runs here, so a
  resize or crop gets back the original bytes at their original size. If the
  suite you're pointing at this ever needs the delivered size to actually be
  real, this is where one would go.
- `/<uuid>/-/json/` answers with the metadata envelope (dimensions, format,
  `dpi`, …) read off the stored bytes, the same numbers `/info/`'s
  `image_info` reports.
- `/<group>~<count>/nth/<i>/...` resolves through the group created by
  `POST /group/` to its `i`-th member, then serves that the same way.

A uuid nobody uploaded, or a group member the store never got, 404s.

### Demo-project files

A fresh session isn't empty — it starts with a handful of files already
"in" the demo project, addressable by uuid without uploading them first,
because both `upload-client`'s own fixtures and the browser suite's e2e
tests point straight at fixed uuids. See `DEMO_FILES` (exported from `.`;
`src/state/store.ts`) for the list and which consumer needs each one; all of them serve the same
bytes, `STOCK_IMAGE` (`src/state/stock-image.ts`) — a real, decodable JPEG,
base64-encoded and decoded at module load so the package stays loadable
outside Node.

## Per-test scenarios

A test that needs the emulator to answer something its own inputs can't
provoke (a throttle, an outage, a project with Signed Uploads on) registers
a _scenario_ on its session. Scenarios live on the session, so they are
per-test by construction: `resetSession()` (or `./browser`'s `reset()`)
clears them, and both answer the session's handle to register them on.

```ts
import { resetSession } from '@uploadcare/api-emulator'

const session = resetSession()

// Answer the next /info/ request with a 503.
session.on('GET /info/', () => new Response(null, { status: 503 }), {
  times: 1
})

// Let the real route run, then change its answer.
session.on('POST /base/', async ({ next }) => {
  const response = await next()
  // ... inspect or replace it
  return response
})

session.files // the SessionView stays readable from the handle
```

- `on(match, handler, { times? })`. `match` is `'METHOD /path/'`, in the
  routes' own path syntax (`/multipart/upload/:uuid/original/` captures
  `params.uuid`, a trailing `*` captures `params.rest`, the trailing slash
  is optional), or `{ method?, path?, host? }`, any of them on its own.
  `host` is the URL's host, port included.
- The handler gets `{ request, params, session, next }`. `request` is a copy,
  so reading its body leaves the real one alone. It answers a `Response`, or
  `undefined` to fall through as if it hadn't matched.
- `next()` runs the rest of the chain and answers its `Response`, with its
  state changes applied (a file it uploaded is in `session.files`). Every
  call runs the rest again; a handler that called it and then falls through
  gets that answer instead of a second run. It is `undefined` only when
  nothing down the chain handles the request.
- The most recently registered scenario runs first, so `next()` from one
  reaches the scenarios registered before it, then the emulator's own route.
- `times: N` removes the scenario after it has answered `N` requests. A
  fall-through doesn't count, and two concurrent requests can't both take
  its last use.
- `on()` and `use()` answer the session, for chaining.

### Presets

`session.use(name, args)` applies a named, parameterised bundle of
scenarios and session settings. The names are the closed `PresetName`
union; `PresetArgs` types each one's args.

| Preset                | Args                                       | What it does                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `throttle`            | `{ match, times = 1, retryAfter = 1 }`     | The next `times` requests `match` covers answer `429 RequestThrottledError` with `retry-after: retryAfter`, before any credential is checked.                                                                                 |
| `signedUploads`       | `{ publicKey? }`                           | Signed Uploads on: a protected request with no Bearer token gets `400 SignatureRequiredError`, after the public-key check. Mint tokens with `mintAuthToken()`.                                                                |
| `unknownProgress`     | none                                       | `/from_url/` jobs report `total: 'unknown'` while in progress, as for a source that sends no `Content-Length`.                                                                                                               |
| `hostNotFound`        | `{ sourceUrl? }`                           | `POST /from_url/` refuses the source at once with `Host does not exist.`, instead of the poll-time failure an unreachable host gets. Every source without `sourceUrl`.                                                        |
| `storedFile`          | `{ uuid, publicKey? }`                     | The stock image, stored under `uuid`, as if uploaded before the test.                                                                                                                                                         |
| `derivativesDisabled` | none                                       | Both derivative POSTs answer `403 derivative_disabled`.                                                                                                                                                                       |
| `derivativesInstant`  | none                                       | A derivative status poll answers the job's terminal frame, for a client that polls on an interval it can't shorten. It wraps the scenarios registered before it: after `derivativeFailure`, the error comes on the first poll. |
| `derivativeFailure`   | `{ code }`                                 | Every derivative job started after it reports `processing` once, then an `error` frame (`error_source: 'ai_gateway'`) with `code`: `content_moderated` or `provider_unavailable`. No file is stored.                        |

A `publicKey` models project ownership: it scopes the preset to that one
project, and adds the project to the session's known keys. Without one, the
preset covers every project. A file `storedFile` puts in a project isn't
found by another project's `/info/` or `/group/`.

`mintAuthToken({ lifetime?, tokenId?, scope?, operations? })` mints a Bearer
token the emulator accepts (a minute long by default), with WebCrypto, so it
works in a page too. It doesn't validate its options, so a test can mint a
token the API refuses. `SIGNED_UPLOADS_SECRET_KEY` is the secret it signs
with, for a suite that mints with `generateAuthToken` itself.

### What stays the real API

These aren't scenarios, and no preset turns them off: a private `from_url`
source (`192.168.*`, `localhost`) is refused; only `REACHABLE_HOSTS`
(`src/apis/upload/sources.ts`: the CDN and `images.unsplash.com`) can be
"fetched" from, and any other host fails at poll time;
the demo-project files are in every fresh session; an unknown public key is
`pub_key is invalid.` (the known ones are `demopublickey` and
`secret_public_key`, plus any project a preset names); every validation
error, and Bearer-token verification below.

### Bearer tokens

A protected request with an `Authorization` header is checked by its token
instead of its public key (`protect` in `src/apis/upload/auth.ts`), with the
Upload API's rules: a non-`Bearer` header is a 401; `signature`/`expire`
alongside a token is a 403; the token must be a JWT signed with
`SIGNED_UPLOADS_SECRET_KEY` and carry a numeric `exp` (30s clock leeway),
otherwise 401 `AccessTokenInvalidError`/`AccessTokenExpiredError`;
`uc.restrictions.scope` items must start with `/` (401) and match the request
path, exactly or as a `/*` prefix (403 `ScopeForbiddenError`);
`uc.restrictions.limits.operations` is counted per token, per session (403
`OperationsLimitExceededError`). Unprotected routes (`/from_url/status/`, the
part `PUT`, CDN, telemetry) ignore the header. Verification uses WebCrypto,
which is why the package needs Node 20+.

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
  which is what upload-client reads. **This divergence is not caught, and not
  waived either** — the spec's `baseUploadSuccessful` declares no `required`
  and no `additionalProperties: false`, so the validator accepts any object at
  all for it, including `{}`. The same is true of `/group/`, `/group/info/`,
  `/from_url/` and `/from_url/status/`. Those five pointers are named in
  `VACUOUS_SCHEMAS` (`test/spec.ts`), which fails if one of them ever starts
  asserting something — or if any other response schema stops. A route on that
  list needs field-by-field assertions in its own test file; `assertMatchesSpec`
  will not do it.
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

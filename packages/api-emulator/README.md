# @uploadcare/api-emulator

An in-process, stateful emulator of the Uploadcare Upload API, for tests that
need real request/response round-trips without hitting the network.

## Browser-safe by design

`@uploadcare/api-emulator` (the `.` export: `handle`, `resetSession`,
`sessionOf`, `SESSION_HEADER` and the scenario constants) runs anywhere `Request`/`Response` exist,
including inside a browser page — that's what lets it back an in-browser MSW
worker. `@uploadcare/api-emulator/listen` is Node-only: it speaks raw HTTP
sockets (`node:http`/`node:https`, `Buffer`) to give a suite a real origin to
point a `baseURL` at. The split exists so the core can be bundled into a page
without dragging Node built-ins with it; `test/dist.test.ts` asserts
neither the `.` export's source nor its built chunks regress that.

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
the process down.

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
session holds only the demo project's files (see [Demo-project files](#demo-project-files))
— no groups, no jobs, nothing uploaded.

- `resetSession(id?)` clears (or starts) a session. Call it between tests
  that share an emulator instance so each test starts from a fresh store.
  With no `id`, it resets the `'default'` session.
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
`PUT`, `POST /multipart/complete/`) all exist today, and so does the CDN.

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
  derivative path), signed uploads and throttle-once (`metadata.mock_throttle`
  in the JSON body).
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
tests point straight at fixed uuids. See `DEMO_FILES` in `src/state/store.ts`
for the list and which consumer needs each one; all of them serve the same
bytes, `STOCK_IMAGE` (`src/state/stock-image.ts`) — a real, decodable JPEG,
base64-encoded and decoded at module load so the package stays loadable
outside Node.

## Caveats

- **The part-PUT `Authorization` check only bites in server mode.** Part
  uploads go to presigned storage URLs and must never carry an `Authorization`
  header — and `upload-client` ignores the status code of a part `PUT`
  entirely, so answering with an error status wouldn't fail a test over a
  leaked header. `handle()` can't touch a socket (it has to stay browser-safe
  for the MSW path), so a part `PUT` that carries the header instead answers
  with an ordinary `Response` carrying the `x-emulator-drop-connection` marker
  header (`DROP_CONNECTION_MARKER` in `src/core/responses.ts`). `listen.ts` — the one
  place that owns the raw socket — recognises that marker and destroys the
  connection instead of writing the response, reproducing the old mock
  server's `ctx.req.destroy()`. Under MSW, or any other consumer of the `.`
  export, there is no socket to drop: the marker response is delivered as an
  ordinary response, so this check only actually drops a connection when the
  emulator is run via `@uploadcare/api-emulator/listen`.

## Scenarios: magic values a test relies on

Every public key, url, and other magic value a test uses to steer the
emulator into a specific scenario is named in `src/apis/upload/scenarios.ts`,
with a comment there naming the consumer. Summarised:

| Value | What it's for |
| --- | --- |
| `UNKNOWN_PROGRESS_KEY` (`pub_test__unknown_progress`) | A `/from_url/` public key whose poll answers report `total: 'unknown'` instead of a byte count. |
| `NO_STORING_KEY` (`pub_test__no_storing`) | The public key `upload-client`'s multipart fixtures use. |
| `UNREACHABLE_SOURCE_URL` (`https://1.com/1.jpg`) | A `from_url` source that fails synchronously, at `POST /from_url/` itself, with a 400 — instead of only failing once the job is polled. |
| `REACHABLE_HOSTS` | The only hosts a `from_url` upload can actually "fetch" from; anything else resolves to a poll-time `Host does not exist` failure. Includes the emulator's own default origin (`localhost:3000`). |
| `isPrivateSourceUrl()` | Flags a `from_url` source as a private/local address (`192.168.*`, `localhost` other than the emulator's own), which `POST /from_url/` rejects. |
| `STUB_GROUP_MEMBER` (`392e3aa3-…`) | The one uuid `POST /group/` accepts without it being uploaded, as a 0-byte stand-in, for `upload-client`'s hardcoded group fixtures. Any other member the session doesn't hold is "Some files not found.". |
| `GROUP_FILES_NOT_FOUND_KEY` (`demopublickey`) | Scoped to `POST /group/` alone: under this key even `STUB_GROUP_MEMBER` counts as missing. Real uploads still group. Everywhere else, this is just an ordinary allowed public key. |
| `SIGNED_UPLOADS_PUBLIC_KEY` (`pub_test__signed_uploads`) | A project with Signed Uploads on: any protected request under it without a Bearer token gets `400 SignatureRequiredError`. Exported from `.`. |
| `SIGNED_UPLOADS_SECRET_KEY` (`mock_secret_key`) | The secret Bearer tokens are verified against (HS256 keyed with `sha256(secret)`, as `generateAuthToken` mints them). Exported from `.`, so a test can mint tokens the emulator accepts. |
| `THROTTLE_ONCE_FIELD` (`metadata[mock_throttle]`) | The first protected request carrying a given value is answered `429 RequestThrottledError` with `retry-after: 1`; later ones with the same value pass. Spent per session. In a JSON body (the derivative endpoints) it's `metadata.mock_throttle`. |
| `DERIVATIVE_DISABLED_PUBLIC_KEY` (`pub_test__derivative_disabled`) | A project without AI generation: both derivative POSTs answer `403 derivative_disabled`. Exported from `.`. |
| `DERIVATIVE_INSTANT_PUBLIC_KEY` (`pub_test__derivative_instant`) | A project whose derivative jobs answer their first status poll with the terminal frame (a ready `success`, or a scenario prompt's error) instead of walking `processing` → `uploading` → `success` not ready. For a browser suite whose client polls on a fixed interval it can't shorten. Exported from `.`. |
| `CONTENT_MODERATED_PROMPT` (`mock_content_moderated`) | A derivative job with this prompt reports `processing` once, then an `error` frame with `error_source: 'ai_gateway'`, `error_code: 'content_moderated'`. Exported from `.`. |
| `PROVIDER_UNAVAILABLE_PROMPT` (`mock_provider_unavailable`) | The same, with `error_code: 'provider_unavailable'`. Exported from `.`. |

### Bearer tokens

A protected request with an `Authorization` header is checked by its token
instead of its public key (`authorize` in `src/apis/upload/auth.ts`), with the
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

import { route } from '../../core/router.js'
import { sessionOf, type TelemetryEvent } from '../../state/store.js'

const isRecord = (value: unknown): value is TelemetryEvent =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * `https://tlm.uploadcare.com/api/v1/events` — the uploader's telemetry sink.
 * Unlike `upload/` and `cdn/`, there is no OpenAPI document for this endpoint:
 * the vendored spec (`test/specs/upload-api.json`) covers the Upload API only.
 * The request shape below wasn't derived from a spec, but from file-uploader's
 * own observed traffic — `tests/api/telemetry/stub.ts`'s `TelemetryBody`, which
 * is what that repo's e2e suite currently gets by stubbing `window.fetch`
 * instead of talking to a real (or emulated) endpoint.
 *
 * The response was established the same way: that stub answers every request
 * with `{}` at HTTP 200 regardless of what was posted, and this route matches
 * it — the point of adding this endpoint here is to let that stub eventually be
 * retired, so its behaviour is the contract, not this package's own idea of
 * one.
 *
 * The body is recorded verbatim and never validated: telemetry is
 * fire-and-forget from the client's side, so a strict emulator would fail tests
 * over a shape mismatch the real endpoint would have silently accepted.
 */
route('POST', '/api/v1/events', async ({ request }) => {
  const session = sessionOf(request)
  const body = await request.json().catch(() => undefined)
  if (isRecord(body)) session.telemetry.push(body)
  return Response.json({})
})

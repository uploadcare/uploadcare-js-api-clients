/**
 * The Upload API's error body, in the two shapes the published spec and
 * upload-client disagree on: the spec documents `text/plain` carrying the bare
 * sentence, but upload-client sends `jsonerrors=1` on every request, which
 * makes the real API answer with this JSON envelope instead. `request` decides
 * which one a caller gets, so every route stays byte-compatible with both.
 *
 * The envelope answers **HTTP 200**, with the real code only in
 * `error.status_code`. That is the real API's behaviour, not a simplification:
 * upload-client's browser transport (`request.browser.ts`) rejects on `status
 * != 200` before the body is ever parsed, yet `api/base.ts` — shared by both
 * transports — builds its `UploadError` out of `error.content`/
 * `error.error_code`. The only way both can be true is a 200 carrying the
 * envelope, which is also what `test/browser/request.test.ts` asserts against
 * production. The `text/plain` branch keeps the real status.
 *
 * `jsonerrors` is truthy-matched, not `=== '1'`: the old mock server this
 * replaced accepted any non-empty value, and so does the real API. With no
 * `jsonerrors` at all, `Accept: application/json` asks for the envelope too —
 * ai-image-editor's derivative client relies on that and never sends
 * `jsonerrors`. An explicit `jsonerrors` wins over the header.
 */
export const apiError = (
  request: Request,
  status: number,
  content: string,
  errorCode?: string,
  /** Extra response headers — throttle-once's `retry-after`, say. */
  headers?: Record<string, string>
): Response => {
  const jsonerrors = new URL(request.url).searchParams.get('jsonerrors')
  const json =
    jsonerrors === null
      ? Boolean(request.headers.get('accept')?.includes('application/json'))
      : jsonerrors !== '' && jsonerrors !== '0'
  if (!json) {
    return new Response(content, {
      status,
      headers: { 'content-type': 'text/plain', ...headers }
    })
  }
  return Response.json(
    {
      error: {
        status_code: status,
        content,
        ...(errorCode ? { error_code: errorCode } : {})
      }
    },
    { headers }
  )
}

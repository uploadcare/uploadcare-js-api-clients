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
      headers: {
        'content-type': 'text/plain',
        'x-content-type-options': 'nosniff',
        ...headers
      }
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

/**
 * A part `PUT` that carries an `Authorization` header is a client bug: part
 * uploads go to presigned storage URLs and must never carry it, and the real S3
 * endpoint would reject the request at the socket rather than with an ordinary
 * HTTP error. `upload-client` ignores the status code of a part `PUT` entirely
 * (see `multipartUpload.ts`), so answering with an error status would not fail
 * a test over a leaked header — only dropping the connection does. `handle()`
 * can't touch a socket (it has to stay browser-safe for the MSW path), so
 * `multipart.ts`'s part route instead answers with `dropConnection()`, an
 * ordinary `Response` carrying this marker header, and `listen.ts` — the one
 * place that owns the raw socket — recognises it and destroys the connection
 * instead of writing the response. Under MSW there is no socket, so the marker
 * response is delivered as-is; see the README's caveats.
 */
export const DROP_CONNECTION_MARKER = 'x-emulator-drop-connection'

export const dropConnection = () =>
  new Response(null, { headers: { [DROP_CONNECTION_MARKER]: '1' } })

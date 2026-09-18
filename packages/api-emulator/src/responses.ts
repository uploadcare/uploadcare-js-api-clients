/**
 * The Upload API's error body, in the two shapes the published spec and
 * upload-client disagree on: the spec documents `text/plain` carrying the bare
 * sentence, but upload-client sends `jsonerrors=1` on every request, which
 * makes the real API answer with this JSON envelope instead. `request` decides
 * which one a caller gets, so every route stays byte-compatible with both.
 */
export const apiError = (
  request: Request,
  status: number,
  content: string,
  errorCode?: string
): Response => {
  const jsonerrors = new URL(request.url).searchParams.get('jsonerrors') === '1'
  if (!jsonerrors) {
    return new Response(content, {
      status,
      headers: { 'content-type': 'text/plain' }
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
    { status }
  )
}

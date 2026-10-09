import { bodyFields, storedBy } from '../../core/body.js'
import { apiError, dropConnection } from '../../core/responses.js'
import { route, type Route } from '../../core/router.js'
import { protect } from './auth.js'
import {
  fileInfo,
  nextUuid,
  sessionOf,
  store,
  UUID
} from '../../state/store.js'

/**
 * The part size `/multipart/start/` hands out, matching the real Upload API
 * rather than the client's own `multipartChunkSize` setting — nothing here is
 * actually uploaded to S3, so the chunking only has to produce the right
 * _number_ of part URLs.
 */
const MULTIPART_CHUNK_SIZE = 5 * 1024 * 1024

/**
 * The emulator's own ceiling, not the real API's: `/multipart/start/` answers
 * one url per part, so an absurd `size` would otherwise build millions of them.
 * ponytail: 100 GiB (20480 parts); raise it if a test ever needs bigger.
 */
const MULTIPART_MAX_SIZE = 100 * 1024 ** 3

export const multipartRoutes: Route[] = [
  /**
   * `/multipart/upload/:uuid/original` — the part `PUT`'s own path segment, not
   * a file uuid this route needs to look anything up by name; the request's
   * `uuid` param is what ties a part back to its `/multipart/start/` session.
   */
  route(
    'PUT',
    '/multipart/upload/:uuid/original',
    async ({ request, params }) => {
      // The check this route exists for: see `dropConnection`.
      if (request.headers.has('authorization')) return dropConnection()

      // A simplification: a part for an unknown upload, or a `partNumber`
      // outside the range, is answered 200 and its bytes dropped. Real S3
      // refuses a PUT whose presigned URL doesn't match an open upload
      // (`NoSuchUpload`, or 403 on a bad signature), and the emulator doesn't
      // sign its part URLs at all. A client that skips a part still finds out:
      // `/multipart/complete/` answers "File size mismatch" (or "File is not
      // found." for an upload that was never started).
      const upload = sessionOf(request).multipart.get(params.uuid ?? '')
      const partNumber = Number(
        new URL(request.url).searchParams.get('partNumber')
      )
      // Bounded on both sides: a `partNumber` past the count `/multipart/start/`
      // handed out would otherwise grow `parts`, and `/multipart/complete/`
      // would then wait for parts the client was never told about.
      if (
        upload &&
        Number.isInteger(partNumber) &&
        partNumber >= 1 &&
        partNumber <= upload.parts.length
      ) {
        upload.parts[partNumber - 1] = new Uint8Array(
          await request.arrayBuffer()
        )
      }
      return new Response(null, { status: 200 })
    }
  ),
  route(
    'POST',
    '/multipart/start/',
    protect(async ({ request }) => {
      const session = sessionOf(request)
      const fields = await bodyFields(request)

      const filename = fields.get('filename')
      if (!filename)
        // schema: requestParamRequiredError
        return apiError(request, 400, 'filename is required.')

      const sizeRaw = fields.get('size')
      const size = sizeRaw ? Number(sizeRaw) : NaN
      if (!Number.isSafeInteger(size))
        // schema: multipartSizeInvalidError
        return apiError(request, 400, 'size should be integer.')

      if (size < 10485760)
        // schema: multipartFileSizeTooSmallError
        return apiError(
          request,
          400,
          'File size can not be less than 10485760 bytes. Please use direct upload instead of multipart.'
        )

      if (size > MULTIPART_MAX_SIZE)
        // schema: multipartFileSizeLimitExceededError
        return apiError(request, 400, 'File size exceeds project limit.')

      const contentType = fields.get('content_type')
      if (!contentType)
        // schema: requestParamRequiredError
        return apiError(request, 400, 'content_type is required.')

      const uuid = nextUuid(session)
      const partCount = Math.ceil(size / MULTIPART_CHUNK_SIZE)
      session.multipart.set(uuid, {
        uuid,
        name: filename,
        mimeType: contentType,
        isStored: storedBy(fields.get('UPLOADCARE_STORE') ?? null),
        parts: Array.from({ length: partCount }, () => undefined)
      })

      // Built from the request's own origin, never hardcoded — the
      // emulator's port is only known once it's actually listening.
      const origin = new URL(request.url).origin
      const parts = Array.from(
        { length: partCount },
        (_, index) =>
          `${origin}/multipart/upload/${uuid}/original?partNumber=${index + 1}&uploadId=fake-upload-id`
      )

      return Response.json({ uuid, parts })
    }, 'UPLOADCARE_PUB_KEY')
  ),
  route(
    'POST',
    '/multipart/complete/',
    protect(async ({ request }) => {
      const session = sessionOf(request)
      const fields = await bodyFields(request)

      const uuid = fields.get('uuid')
      if (!uuid)
        // schema: multipartFileIdRequiredError
        return apiError(request, 400, 'uuid is required.')

      if (!UUID.test(uuid))
        // schema: uuidInvalidError
        return apiError(request, 400, 'uuid is invalid.')

      const upload = session.multipart.get(uuid)
      if (!upload)
        // schema: multipartFileNotFoundError — no /multipart/start/ by this uuid.
        return apiError(request, 404, 'File is not found.')

      const received = upload.parts.filter(
        (part): part is Uint8Array => part !== undefined
      )
      if (received.length < upload.parts.length)
        // schema: multipartUploadSizeTooSmallError — a part was never PUT.
        return apiError(
          request,
          400,
          'File size mismatch. Not all parts uploaded?'
        )

      const bytes = new Uint8Array(await new Blob(received).arrayBuffer())

      // Under the uuid /multipart/start/ handed out, so /info/ and the CDN
      // answer for it.
      const stored = store(
        session,
        {
          name: upload.name,
          mimeType: upload.mimeType,
          bytes,
          isStored: upload.isStored
        },
        uuid
      )

      return Response.json(fileInfo(stored))
    }, 'UPLOADCARE_PUB_KEY')
  )
]

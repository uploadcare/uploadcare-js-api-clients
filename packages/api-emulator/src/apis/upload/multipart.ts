import { storedBy } from '../../core/body.js'
import { apiError, dropConnection } from '../../core/responses.js'
import { route } from '../../core/router.js'
import { imageSize } from '../../state/image-size.js'
import { fileInfo, nextUuid, sessionOf } from '../../state/store.js'

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

const asString = (value: FormDataEntryValue | null) =>
  typeof value === 'string' ? value : null

/**
 * `/multipart/upload/:uuid/original` — the part `PUT`'s own path segment, not a
 * file uuid this route needs to look anything up by name; the request's `uuid`
 * param is what ties a part back to its `/multipart/start/` session.
 */
route(
  'PUT',
  '/multipart/upload/:uuid/original',
  async ({ request, params }) => {
    // The check this route exists for: see `DROP_CONNECTION_MARKER` in
    // core/responses.ts for why a marker response, not an error status.
    if (request.headers.has('authorization')) return dropConnection()

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
      upload.parts[partNumber - 1] = new Uint8Array(await request.arrayBuffer())
    }
    return new Response(null, { status: 200 })
  }
)

route(
  'POST',
  '/multipart/start/',
  async ({ request }) => {
    const session = sessionOf(request)
    const form = await request.formData().catch(() => new FormData())

    const filename = asString(form.get('filename'))
    if (!filename)
      // schema: requestParamRequiredError
      return apiError(request, 400, 'filename is required.')

    const sizeRaw = asString(form.get('size'))
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

    const contentType = asString(form.get('content_type'))
    if (!contentType)
      // schema: requestParamRequiredError
      return apiError(request, 400, 'content_type is required.')

    const uuid = nextUuid(session)
    const partCount = Math.ceil(size / MULTIPART_CHUNK_SIZE)
    session.multipart.set(uuid, {
      uuid,
      name: filename,
      size,
      mimeType: contentType,
      isStored: storedBy(form.get('UPLOADCARE_STORE')),
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
  },
  { protected: { paramName: 'UPLOADCARE_PUB_KEY', source: 'body' } }
)

route(
  'POST',
  '/multipart/complete/',
  async ({ request }) => {
    const session = sessionOf(request)
    const form = await request.formData().catch(() => new FormData())

    const uuid = asString(form.get('uuid'))
    if (!uuid)
      // schema: multipartFileIdRequiredError
      return apiError(request, 400, 'uuid is required.')

    const upload = session.multipart.get(uuid)
    if (!upload)
      // schema: uuidInvalidError — no /multipart/start/ session by this uuid.
      return apiError(request, 400, 'uuid is invalid.')

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

    // The completed file's `size` is the bytes actually received, not the
    // `upload.size` `/multipart/start/` was told to expect. That's deliberate:
    // a test that PUTs short parts (as this package's own does) should see the
    // file it really assembled, and `/info/` and the CDN then agree with it.
    // It does mean `upload.size` is written and never read — it stays only
    // because `/multipart/start/` needs it to work out the part count.
    const bytes = new Uint8Array(
      received.reduce((total, part) => total + part.byteLength, 0)
    )
    let offset = 0
    for (const part of received) {
      bytes.set(part, offset)
      offset += part.byteLength
    }

    // Stored like any other file, so /info/ and the CDN can answer about it —
    // under the same uuid /multipart/start/ already handed out, not a freshly
    // minted one, so this round-trips through session.files directly rather
    // than through store() (which always mints its own).
    const stored = {
      uuid,
      name: upload.name,
      size: bytes.byteLength,
      mimeType: upload.mimeType,
      bytes,
      image: imageSize(bytes),
      isStored: upload.isStored
    }
    session.files.set(uuid, stored)

    return Response.json(fileInfo(stored))
  },
  { protected: { paramName: 'UPLOADCARE_PUB_KEY', source: 'body' } }
)

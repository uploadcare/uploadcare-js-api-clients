import { apiError } from '../../core/responses.js'
import { route } from '../../core/router.js'
import { imageSize } from '../../state/image-size.js'
import { fileInfo, nextUuid, sessionOf } from '../../state/store.js'
import { DROP_CONNECTION_MARKER, MULTIPART_CHUNK_SIZE } from './scenarios.js'

const asString = (value: FormDataEntryValue | null) =>
  typeof value === 'string' ? value : null

/**
 * `UPLOADCARE_STORE=auto` (the default, like `base.ts`'s) leaves it to project
 * settings, and the demo project stores.
 */
const storedBy = (value: FormDataEntryValue | null) =>
  value !== '0' && value !== 'false'

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
    // scenarios.ts for why a marker response, not an error status.
    if (request.headers.has('authorization')) {
      return new Response(null, {
        status: 200,
        headers: { [DROP_CONNECTION_MARKER]: '1' }
      })
    }

    const upload = sessionOf(request).multipart.get(params.uuid ?? '')
    const partNumber = Number(
      new URL(request.url).searchParams.get('partNumber')
    )
    if (upload && Number.isInteger(partNumber) && partNumber >= 1) {
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
    if (!sizeRaw)
      // schema: multipartSizeInvalidError
      return apiError(request, 400, 'size should be integer.')

    const size = Number(sizeRaw)
    if (size < 10485760)
      // schema: multipartFileSizeTooSmallError
      return apiError(
        request,
        400,
        'File size can not be less than 10485760 bytes. Please use direct upload instead of multipart.'
      )

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
      parts: Array.from({ length: partCount }, () => new Uint8Array())
    })

    // Built from the request's own origin (Decision D5), never hardcoded — the
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

    const bytes = new Uint8Array(
      upload.parts.reduce((total, part) => total + part.byteLength, 0)
    )
    let offset = 0
    for (const part of upload.parts) {
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

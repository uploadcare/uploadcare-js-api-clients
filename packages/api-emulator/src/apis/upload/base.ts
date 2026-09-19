import { apiError } from '../../core/responses.js'
import { route } from '../../core/router.js'
import { imageSize } from '../../state/image-size.js'
import { sessionOf, store } from '../../state/store.js'

/** `store=auto` leaves it to project settings, and the demo project stores. */
const storedBy = (value: FormDataEntryValue | null) =>
  value !== '0' && value !== 'false'

/**
 * Direct upload. The file part is kept whole, because the CDN has to serve it
 * back.
 *
 * The public-key gate is the router's (`{ protected: { paramName:
 * 'UPLOADCARE_PUB_KEY', source: 'body' } }`) — `uploadFileGroup/
 * groupFromObject.test.ts` ("should be rejected with error code if failed")
 * uploads with an invalid key and expects the failure here, at `/base/`, before
 * a group is ever created.
 */
route(
  'POST',
  '/base/',
  async ({ request }) => {
    const form = await request.formData()
    const part = form.get('file')
    if (!(part instanceof File)) {
      // schema: filesRequiredError
      return apiError(request, 400, 'Request does not contain files.')
    }

    const bytes = new Uint8Array(await part.arrayBuffer())
    const stored = store(sessionOf(request), {
      name: part.name,
      size: bytes.byteLength,
      mimeType: part.type || 'application/octet-stream',
      bytes,
      image: imageSize(bytes),
      isStored: storedBy(form.get('UPLOADCARE_STORE'))
    })

    return Response.json({ file: stored.uuid })
  },
  { protected: { paramName: 'UPLOADCARE_PUB_KEY', source: 'body' } }
)

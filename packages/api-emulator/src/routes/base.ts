import { imageSize } from '../image-size.js'
import { apiError } from '../responses.js'
import { route } from '../router.js'
import { sessionOf, store } from '../store.js'

/** `store=auto` leaves it to project settings, and the demo project stores. */
const storedBy = (value: string | null) => value !== '0' && value !== 'false'

/**
 * Direct upload. The file part is kept whole, because the CDN has to serve it
 * back.
 */
route('POST', '/base/', async ({ request }) => {
  const form = await request.formData()
  const part = form.get('file')
  if (!(part instanceof File)) {
    return apiError(400, 'file is required')
  }

  const bytes = new Uint8Array(await part.arrayBuffer())
  const stored = store(sessionOf(request), {
    name: part.name,
    size: bytes.byteLength,
    mimeType: part.type || 'application/octet-stream',
    bytes,
    image: imageSize(bytes),
    isStored: storedBy(form.get('UPLOADCARE_STORE') as string | null)
  })

  return Response.json({ file: stored.uuid })
})

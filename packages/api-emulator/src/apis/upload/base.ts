import { storedBy } from '../../core/body.js'
import { apiError } from '../../core/responses.js'
import { route, type Route } from '../../core/router.js'
import { protect } from './auth.js'
import { imageSize } from '../../state/image-size.js'
import { sessionOf, store } from '../../state/store.js'

/**
 * Direct upload. The file part is kept whole, because the CDN has to serve it
 * back.
 */
export const baseRoutes: Route[] = [
  route(
    'POST',
    '/base/',
    protect(async ({ request }) => {
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
    }, 'UPLOADCARE_PUB_KEY')
  )
]

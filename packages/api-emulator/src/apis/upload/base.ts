import { apiError } from '../../core/responses.js'
import { route } from '../../core/router.js'
import { imageSize } from '../../state/image-size.js'
import { sessionOf, store } from '../../state/store.js'
import { requirePublicKey } from './auth.js'

/** `store=auto` leaves it to project settings, and the demo project stores. */
const storedBy = (value: FormDataEntryValue | null) =>
  value !== '0' && value !== 'false'

/**
 * Direct upload. The file part is kept whole, because the CDN has to serve it
 * back.
 *
 * Found while verifying Task 4's group tests: this route never actually called
 * `requirePublicKey`, despite `auth.ts`'s own comment already documenting
 * `UPLOADCARE_PUB_KEY` as `/base/`'s param name — the wiring was just missing.
 * `uploadFileGroup/groupFromObject.test.ts` ("should be rejected with error
 * code if failed") uploads with an invalid key and expects the failure here, at
 * `/base/`, before a group is ever created.
 */
route('POST', '/base/', async ({ request }) => {
  const form = await request.formData()
  const authError = requirePublicKey(
    request,
    form.get('UPLOADCARE_PUB_KEY') as string | null,
    'UPLOADCARE_PUB_KEY'
  )
  if (authError) return authError

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
})

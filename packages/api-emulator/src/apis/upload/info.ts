import { apiError } from '../../core/responses.js'
import { route } from '../../core/router.js'
import { fileInfo, sessionOf } from '../../state/store.js'
import { requirePublicKey } from './auth.js'

route('GET', '/info/', ({ request }) => {
  const params = new URL(request.url).searchParams
  const authError = requirePublicKey(request, params.get('pub_key'))
  if (authError) return authError

  const id = params.get('file_id') ?? ''
  const file = sessionOf(request).files.get(id)
  // schema: fileNotFoundError
  return file
    ? Response.json(fileInfo(file))
    : apiError(request, 404, 'File is not found.')
})

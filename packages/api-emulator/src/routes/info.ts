import { requirePublicKey } from '../auth.js'
import { apiError } from '../responses.js'
import { route } from '../router.js'
import { fileInfo, sessionOf } from '../store.js'

route('GET', '/info/', ({ request }) => {
  const params = new URL(request.url).searchParams
  const authError = requirePublicKey(params.get('pub_key'))
  if (authError) return authError

  const id = params.get('file_id') ?? ''
  const file = sessionOf(request).files.get(id)
  return file
    ? Response.json(fileInfo(file))
    : apiError(404, 'file_id is invalid')
})

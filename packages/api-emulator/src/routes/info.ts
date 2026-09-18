import { apiError } from '../responses.js'
import { route } from '../router.js'
import { fileInfo, sessionOf } from '../store.js'

route('GET', '/info/', ({ request }) => {
  const id = new URL(request.url).searchParams.get('file_id') ?? ''
  const file = sessionOf(request).files.get(id)
  return file
    ? Response.json(fileInfo(file))
    : apiError(404, 'file_id is invalid')
})

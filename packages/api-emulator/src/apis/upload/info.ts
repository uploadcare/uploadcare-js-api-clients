import { apiError } from '../../core/responses.js'
import { route } from '../../core/router.js'
import { fileInfo, sessionOf } from '../../state/store.js'

route(
  'GET',
  '/info/',
  ({ request }) => {
    const params = new URL(request.url).searchParams
    const id = params.get('file_id') ?? ''
    const file = sessionOf(request).files.get(id)
    // schema: fileNotFoundError
    return file
      ? Response.json(fileInfo(file))
      : apiError(request, 404, 'File is not found.')
  },
  { protected: true }
)

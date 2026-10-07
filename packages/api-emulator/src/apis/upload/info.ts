import { apiError } from '../../core/responses.js'
import { route, type Route } from '../../core/router.js'
import { protect } from './auth.js'
import { fileInfo, sessionOf } from '../../state/store.js'

export const infoRoutes: Route[] = [
  route(
    'GET',
    '/info/',
    protect(({ request }) => {
      const params = new URL(request.url).searchParams
      const id = params.get('file_id')
      if (!id)
        // schema: fileIdRequiredError
        return apiError(request, 400, 'file_id is required.')
      const file = sessionOf(request).files.get(id)
      // schema: fileNotFoundError
      return file
        ? Response.json(fileInfo(file))
        : apiError(request, 404, 'File is not found.')
    })
  )
]

import { apiError } from '../../core/responses.js'
import { route, type Route } from '../../core/router.js'
import { protect } from './auth.js'
import { fileInfo, fileOf, sessionOf, UUID } from '../../state/store.js'

export const infoRoutes: Route[] = [
  route(
    'GET',
    '/info/',
    protect(({ request, publicKey }) => {
      const params = new URL(request.url).searchParams
      const id = params.get('file_id')
      if (!id)
        // schema: fileIdRequiredError
        return apiError(
          request,
          400,
          'file_id is required.',
          'FileIdRequiredError'
        )
      if (!UUID.test(id))
        // schema: fileIdInvalidError
        return apiError(
          request,
          400,
          'file_id is invalid.',
          'FileIdInvalidError'
        )
      const file = fileOf(sessionOf(request), id, publicKey)
      // schema: fileNotFoundError
      return file
        ? Response.json(fileInfo(file))
        : apiError(request, 404, 'File is not found.', 'FileNotFoundError')
    })
  )
]

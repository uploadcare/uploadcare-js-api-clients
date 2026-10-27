import { storedBy } from '../../core/body.js'
import { apiError } from '../../core/responses.js'
import { route, type Route } from '../../core/router.js'
import { protect } from './auth.js'
import {
  fileInfo,
  nextUuid,
  sessionOf,
  storeStockImage
} from '../../state/store.js'
import { hostOf, isPrivateSourceUrl, REACHABLE_HOSTS } from './sources.js'

/**
 * The name the real API takes from a download URL: the `dl` parameter when
 * there is one, the last path segment if not.
 */
const nameFromUrl = (sourceUrl: string) => {
  const url = new URL(sourceUrl)
  return (
    url.searchParams.get('dl') ??
    url.pathname.split('/').filter(Boolean).at(-1) ??
    'file'
  )
}

/** `nope` has none; `ftp://…` has one the real API refuses. */
const URL_SCHEME = /^([a-z][a-z0-9+.-]*):/i

/** `http://`, `https://?x`: a scheme and nothing where the host goes. */
const EMPTY_HOST = /^https?:\/\/(?:[/?#]|$)/i

const truthy = (value: FormDataEntryValue | string | null) =>
  value === '1' || value === 'true'

export const fromUrlRoutes: Route[] = [
  route(
    'POST',
    '/from_url/',
    protect(({ request }) => {
      const session = sessionOf(request)
      const params = new URL(request.url).searchParams
      const sourceUrl = params.get('source_url')
      if (!sourceUrl)
        // schema: sourceURLRequiredError
        return apiError(
          request,
          400,
          'source_url is required.',
          'SourceURLRequiredError'
        )

      const scheme = URL_SCHEME.exec(sourceUrl)?.[1]?.toLowerCase()
      if (!scheme)
        // schema: urlSchemeRequiredError
        return apiError(
          request,
          400,
          'No URL scheme supplied.',
          'URLSchemeRequiredError'
        )
      if (scheme !== 'http' && scheme !== 'https')
        // schema: urlSchemeInvalidError
        return apiError(
          request,
          400,
          'Invalid URL scheme.',
          'URLSchemeInvalidError'
        )
      if (!URL.canParse(sourceUrl))
        return EMPTY_HOST.test(sourceUrl)
          ? // schema: urlHostRequiredError
            apiError(
              request,
              400,
              'No URL host supplied.',
              'URLHostRequiredError'
            )
          : apiError(
              request,
              400,
              'Failed to parse URL.',
              'URLParsingFailedError'
            )

      if (isPrivateSourceUrl(sourceUrl))
        // schema: urlHostPrivateIPForbiddenError
        return apiError(
          request,
          400,
          'Only public IPs are allowed.',
          'URLHostPrivateIPForbiddenError'
        )

      // The client's `fileName` option overrides the name the URL would
      // otherwise imply.
      const name = params.get('filename') ?? nameFromUrl(sourceUrl)

      // `check_URL_duplicates` short-circuits to the file info only for a source
      // this session has uploaded *before* — the real API's whole point being
      // that the second upload of the same URL is deduplicated. A first upload
      // with both flags set still goes through the token/poll path, which is
      // otherwise unreachable with dedup enabled. `save_URL_duplicates` is what
      // puts the source in the index in the first place.
      const checkForDuplicates = truthy(params.get('check_URL_duplicates'))
      const saveForDuplicates = truthy(params.get('save_URL_duplicates'))
      const duplicate = checkForDuplicates
        ? session.fromUrlSources.get(sourceUrl)
        : undefined
      if (duplicate) {
        const file = session.files.get(duplicate)
        if (file) return Response.json({ type: 'file_info', ...fileInfo(file) })
      }

      const host = hostOf(sourceUrl)
      const uuid =
        host && REACHABLE_HOSTS.includes(host)
          ? storeStockImage(session, name, storedBy(params.get('store'))).uuid
          : undefined

      if (saveForDuplicates && uuid) session.fromUrlSources.set(sourceUrl, uuid)

      const token = nextUuid(session)
      session.fromUrlJobs.set(token, { uuid, done: 0 })
      return Response.json({ type: 'token', token })
    })
  ),
  route('GET', '/from_url/status/', ({ request }) => {
    const session = sessionOf(request)
    const token = new URL(request.url).searchParams.get('token')
    if (!token)
      // schema: tokenRequiredError
      return apiError(request, 400, 'token is required.', 'TokenRequiredError')

    const job = session.fromUrlJobs.get(token)
    if (!job)
      // schema: fileUploadInfoUnknownStatus — a token this session never
      // issued, or one issued long enough ago the real API would have expired
      // it.
      return Response.json({ status: 'unknown' })

    const file = job.uuid && session.files.get(job.uuid)
    if (!file)
      // The host wasn't in REACHABLE_HOSTS: the job got a token at POST time
      // (see sources.ts on why that's deliberate), but there is no file
      // behind it to ever finish fetching.
      return Response.json({ status: 'error', error: 'Host does not exist' })

    if (job.done >= file.size)
      return Response.json({ status: 'success', ...fileInfo(file) })

    const response = { status: 'progress', total: file.size, done: job.done }
    job.done = Math.min(job.done + Math.ceil(file.size / 3), file.size)
    return Response.json(response)
  })
]

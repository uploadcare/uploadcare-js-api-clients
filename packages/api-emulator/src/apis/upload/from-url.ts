import { apiError } from '../../core/responses.js'
import { route } from '../../core/router.js'
import { STOCK_IMAGE } from '../../state/stock-image.js'
import {
  fileInfo,
  nextUuid,
  sessionOf,
  storeStockImage
} from '../../state/store.js'
import {
  hostOf,
  isPrivateSourceUrl,
  REACHABLE_HOSTS,
  UNKNOWN_PROGRESS_KEY,
  UNREACHABLE_SOURCE_URL
} from './scenarios.js'

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

const truthy = (value: FormDataEntryValue | string | null) =>
  value === '1' || value === 'true'

route(
  'POST',
  '/from_url/',
  ({ request }) => {
    const session = sessionOf(request)
    const params = new URL(request.url).searchParams
    const sourceUrl = params.get('source_url')
    if (!sourceUrl)
      // schema: sourceURLRequiredError
      return apiError(request, 400, 'source_url is required.')

    if (!URL.canParse(sourceUrl))
      return apiError(
        request,
        400,
        'Failed to parse URL.',
        'URLParsingFailedError'
      )

    if (sourceUrl === UNREACHABLE_SOURCE_URL)
      // schema: hostnameNotFoundError — the one host that fails synchronously;
      // see scenarios.ts.
      return apiError(request, 400, 'Host does not exist.')

    if (isPrivateSourceUrl(sourceUrl))
      // schema: urlHostPrivateIPForbiddenError
      return apiError(request, 400, 'Only public IPs are allowed.')

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
        ? storeStockImage(session, name, params.get('store') !== '0').uuid
        : ''

    if (saveForDuplicates && uuid) session.fromUrlSources.set(sourceUrl, uuid)

    const token = nextUuid(session)
    session.fromUrlJobs.set(token, {
      uuid,
      polls: 0,
      computable: params.get('pub_key') !== UNKNOWN_PROGRESS_KEY,
      total: STOCK_IMAGE.byteLength,
      done: 0
    })
    return Response.json({ type: 'token', token })
  },
  { protected: true }
)

route('GET', '/from_url/status/', ({ request }) => {
  const session = sessionOf(request)
  const token = new URL(request.url).searchParams.get('token')
  if (!token)
    // schema: tokenRequiredError
    return apiError(request, 400, 'token is required.')

  const job = session.fromUrlJobs.get(token)
  if (!job)
    // schema: fileUploadInfoUnknownStatus — a token this session never
    // issued, or one issued long enough ago the real API would have expired
    // it.
    return Response.json({ status: 'unknown' })

  job.polls += 1
  const file = session.files.get(job.uuid)
  if (!file)
    // The host wasn't in REACHABLE_HOSTS: the job got a token at POST time
    // (see scenarios.ts on why that's deliberate), but there is no file
    // behind it to ever finish fetching.
    return Response.json({ status: 'error', error: 'Host does not exist' })

  if (job.done >= job.total)
    return Response.json({ status: 'success', ...fileInfo(file) })

  const response = job.computable
    ? { status: 'progress', total: job.total, done: job.done }
    : { status: 'progress', total: 'unknown', done: job.done }
  job.done = Math.min(job.done + Math.ceil(job.total / 3), job.total)
  return Response.json(response)
})

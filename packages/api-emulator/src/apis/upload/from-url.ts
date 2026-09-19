import { apiError } from '../../core/responses.js'
import { route } from '../../core/router.js'
import { fileInfo, nextUuid, sessionOf, store } from '../../state/store.js'
import { requirePublicKey } from './auth.js'
import {
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

/**
 * A stand-in for whatever the source URL points at — nothing is ever really
 * fetched, so every reachable `from_url` upload resolves to this same 1×1 JPEG,
 * named after the URL rather than after the bytes.
 */
const STOCK_IMAGE = new Uint8Array([
  0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0xff, 0xd9
])

const truthy = (value: FormDataEntryValue | string | null) =>
  value === '1' || value === 'true'

route('POST', '/from_url/', ({ request }) => {
  const session = sessionOf(request)
  const params = new URL(request.url).searchParams
  const authError = requirePublicKey(request, params.get('pub_key'))
  if (authError) return authError

  const sourceUrl = params.get('source_url')
  if (!sourceUrl)
    // schema: sourceURLRequiredError
    return apiError(request, 400, 'source_url is required.')

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

  const checkForDuplicates = truthy(params.get('check_URL_duplicates'))
  const saveForDuplicates = truthy(params.get('save_URL_duplicates'))
  if (checkForDuplicates && saveForDuplicates) {
    const stored = store(session, {
      name,
      size: STOCK_IMAGE.byteLength,
      mimeType: 'image/jpeg',
      bytes: STOCK_IMAGE,
      image: { width: 1, height: 1, format: 'JPEG' },
      isStored: true
    })
    return Response.json({ type: 'file_info', ...fileInfo(stored) })
  }

  const host = URL.parse(sourceUrl)?.host
  const uuid =
    host && REACHABLE_HOSTS.includes(host)
      ? store(session, {
          name,
          size: STOCK_IMAGE.byteLength,
          mimeType: 'image/jpeg',
          bytes: STOCK_IMAGE,
          image: { width: 1, height: 1, format: 'JPEG' },
          isStored: params.get('store') !== '0'
        }).uuid
      : ''

  const token = nextUuid(session)
  session.fromUrlJobs.set(token, {
    uuid,
    polls: 0,
    computable: params.get('pub_key') !== UNKNOWN_PROGRESS_KEY,
    total: STOCK_IMAGE.byteLength,
    done: 0
  })
  return Response.json({ type: 'token', token })
})

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
  job.done = Math.min(job.done + job.total / 3, job.total)
  return Response.json(response)
})

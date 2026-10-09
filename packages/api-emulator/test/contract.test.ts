import { beforeEach, expect, it } from 'vitest'
import { createFetch, resetSession } from '../src/index.js'

/**
 * Error paths the emulator shares with the real Upload API, asserted the same
 * way against both. `npm test` runs them in-process against the emulator; `npm
 * run test:contract` sends them to `CONTRACT_BASE_URL` with
 * `CONTRACT_PUBLIC_KEY`, and a failure there means the emulator has drifted
 * from the real API. Every request is refused before anything is stored, so a
 * run leaves nothing behind in the project.
 *
 * Each case compares the envelope's `status_code`, `content` and `error_code`.
 * A case that fails against the real API is a bug in the emulator: fix the
 * emulator, not the case.
 */

const baseUrl = process.env.CONTRACT_BASE_URL
const publicKey = process.env.CONTRACT_PUBLIC_KEY
if (baseUrl && !publicKey)
  throw new Error('CONTRACT_BASE_URL is set, but CONTRACT_PUBLIC_KEY is not')

const origin = baseUrl ?? 'https://upload.uploadcare.com'
const pubKey = publicKey ?? 'demopublickey'
const send = baseUrl ? fetch : createFetch()

beforeEach(() => {
  resetSession()
})

const form = (fields: Record<string, string>, withFile = false) => {
  const body = new FormData()
  for (const [name, value] of Object.entries(fields)) body.set(name, value)
  if (withFile) body.set('file', new File(['x'], 'a.txt'))
  return { method: 'POST', body }
}

const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000'

it.each<{
  name: string
  path: () => string
  init?: () => RequestInit
  status: number
  content: string
  errorCode: string
}>([
  {
    name: 'POST /base/ without a public key',
    path: () => '/base/',
    init: () => form({}, true),
    status: 403,
    content: 'UPLOADCARE_PUB_KEY is required.',
    errorCode: 'ProjectPublicKeyRequiredError'
  },
  {
    name: 'POST /base/ with an unknown public key',
    path: () => '/base/',
    init: () => form({ UPLOADCARE_PUB_KEY: 'invalidpublickey' }, true),
    status: 403,
    content: 'UPLOADCARE_PUB_KEY is invalid.',
    errorCode: 'ProjectPublicKeyInvalidError'
  },
  {
    name: 'POST /base/ without a file',
    path: () => '/base/',
    init: () => form({ UPLOADCARE_PUB_KEY: pubKey }),
    status: 400,
    content: 'Request does not contain files.',
    errorCode: 'FilesRequiredError'
  },
  {
    name: 'GET /info/ without a public key',
    path: () => `/info/?file_id=${UNKNOWN_UUID}`,
    status: 403,
    content: 'pub_key is required.',
    errorCode: 'ProjectPublicKeyRequiredError'
  },
  {
    name: 'GET /info/ with an unknown public key',
    path: () => `/info/?pub_key=invalidpublickey&file_id=${UNKNOWN_UUID}`,
    status: 403,
    content: 'pub_key is invalid.',
    errorCode: 'ProjectPublicKeyInvalidError'
  },
  {
    name: 'GET /info/ without a file_id',
    path: () => `/info/?pub_key=${pubKey}`,
    status: 400,
    content: 'file_id is required.',
    errorCode: 'FileIdRequiredError'
  },
  {
    name: 'GET /info/ with a file_id that is not a uuid',
    path: () => `/info/?pub_key=${pubKey}&file_id=nope`,
    status: 400,
    content: 'file_id is invalid.',
    errorCode: 'FileIdInvalidError'
  },
  {
    name: 'GET /info/ for a uuid nobody uploaded',
    path: () => `/info/?pub_key=${pubKey}&file_id=${UNKNOWN_UUID}`,
    status: 404,
    content: 'File is not found.',
    errorCode: 'FileNotFoundError'
  },
  {
    name: 'POST /group/ without members',
    path: () => '/group/',
    init: () => form({ pub_key: pubKey }),
    status: 400,
    content: 'No files[N] parameters found.',
    errorCode: 'GroupFilesInvalidError'
  },
  {
    name: 'POST /group/ with a member that is not a file url',
    path: () => '/group/',
    init: () => form({ pub_key: pubKey, 'files[0]': 'nope' }),
    status: 400,
    content: 'This is not valid file url: nope.',
    errorCode: 'GroupFileURLParsingFailedError'
  },
  {
    name: 'POST /group/ with a member nobody uploaded',
    path: () => '/group/',
    init: () => form({ pub_key: pubKey, 'files[0]': UNKNOWN_UUID }),
    status: 400,
    content: 'Some files not found.',
    errorCode: 'GroupFilesNotFoundError'
  },
  {
    name: 'GET /group/info/ without a group_id',
    path: () => `/group/info/?pub_key=${pubKey}`,
    status: 400,
    content: 'group_id is required.',
    errorCode: 'GroupIdRequiredError'
  },
  {
    name: 'GET /group/info/ for a group nobody created',
    path: () => `/group/info/?pub_key=${pubKey}&group_id=${UNKNOWN_UUID}~1`,
    status: 404,
    content: 'group_id is invalid.',
    errorCode: 'GroupNotFoundError'
  },
  {
    name: 'POST /from_url/ without a source_url',
    path: () => `/from_url/?pub_key=${pubKey}`,
    init: () => ({ method: 'POST' }),
    status: 400,
    content: 'source_url is required.',
    errorCode: 'SourceURLRequiredError'
  },
  {
    name: 'POST /from_url/ for a source_url without a scheme',
    path: () =>
      `/from_url/?pub_key=${pubKey}&source_url=${encodeURIComponent('nope')}`,
    init: () => ({ method: 'POST' }),
    status: 400,
    content: 'No URL scheme supplied.',
    errorCode: 'URLSchemeRequiredError'
  },
  {
    name: 'POST /from_url/ for a source_url without a host',
    path: () =>
      `/from_url/?pub_key=${pubKey}&source_url=${encodeURIComponent('http://')}`,
    init: () => ({ method: 'POST' }),
    status: 400,
    content: 'No URL host supplied.',
    errorCode: 'URLHostRequiredError'
  },
  {
    name: 'POST /from_url/ for a source_url with a scheme other than http(s)',
    path: () =>
      `/from_url/?pub_key=${pubKey}&source_url=${encodeURIComponent('ftp://example.com/a.jpg')}`,
    init: () => ({ method: 'POST' }),
    status: 400,
    content: 'Invalid URL scheme.',
    errorCode: 'URLSchemeInvalidError'
  },
  {
    name: 'POST /from_url/ for a source_url that does not parse',
    path: () =>
      `/from_url/?pub_key=${pubKey}&source_url=${encodeURIComponent('http://[::1')}`,
    init: () => ({ method: 'POST' }),
    status: 400,
    content: 'Failed to parse URL.',
    errorCode: 'URLParsingFailedError'
  },
  {
    name: 'POST /from_url/ for a private IP',
    path: () =>
      `/from_url/?pub_key=${pubKey}&source_url=${encodeURIComponent('http://192.168.1.10/1.jpg')}`,
    init: () => ({ method: 'POST' }),
    status: 400,
    content: 'Only public IPs are allowed.',
    errorCode: 'URLHostPrivateIPForbiddenError'
  },
  {
    name: 'GET /from_url/status/ without a token',
    path: () => '/from_url/status/',
    status: 400,
    content: 'token is required.',
    errorCode: 'TokenRequiredError'
  },
  {
    name: 'POST /multipart/start/ without a filename',
    path: () => '/multipart/start/',
    init: () =>
      form({
        UPLOADCARE_PUB_KEY: pubKey,
        size: '20000000',
        content_type: 'application/octet-stream'
      }),
    status: 400,
    content: 'filename is required.',
    errorCode: 'RequestParamRequiredError'
  },
  {
    name: 'POST /multipart/start/ below the minimum size',
    path: () => '/multipart/start/',
    init: () =>
      form({
        UPLOADCARE_PUB_KEY: pubKey,
        filename: 'a.bin',
        size: '100',
        content_type: 'application/octet-stream'
      }),
    status: 400,
    content:
      'File size can not be less than 10000000 bytes. Please use direct upload instead of multipart.',
    errorCode: 'MultipartFileSizeTooSmallError'
  },
  {
    name: 'POST /multipart/start/ with a size that is not an integer',
    path: () => '/multipart/start/',
    init: () =>
      form({
        UPLOADCARE_PUB_KEY: pubKey,
        filename: 'a.bin',
        size: 'abc',
        content_type: 'application/octet-stream'
      }),
    status: 400,
    content: 'size should be integer.',
    errorCode: 'MultipartSizeInvalidError'
  },
  {
    name: 'POST /multipart/complete/ without a uuid',
    path: () => '/multipart/complete/',
    init: () => form({ UPLOADCARE_PUB_KEY: pubKey }),
    status: 400,
    content: 'uuid is required.',
    errorCode: 'MultipartFileIdRequiredError'
  },
  {
    name: 'POST /multipart/complete/ with a uuid that is not a uuid',
    path: () => '/multipart/complete/',
    init: () => form({ UPLOADCARE_PUB_KEY: pubKey, uuid: 'nope' }),
    status: 400,
    content: 'uuid is invalid.',
    errorCode: 'UUIDInvalidError'
  },
  {
    name: 'POST /multipart/complete/ for an upload nobody started',
    path: () => '/multipart/complete/',
    init: () => form({ UPLOADCARE_PUB_KEY: pubKey, uuid: UNKNOWN_UUID }),
    status: 404,
    content: 'File is not found.',
    errorCode: 'MultipartFileNotFoundError'
  }
])('$name', async ({ path, init, status, content, errorCode }) => {
  const url = new URL(path(), origin)
  url.searchParams.set('jsonerrors', '1')
  const response = await send(url, init?.())
  const body = (await response.json()) as { error?: unknown }
  expect(body.error).toMatchObject({
    status_code: status,
    content,
    error_code: errorCode
  })
})

it('answers unknown for a from_url token nobody issued', async () => {
  const response = await send(new URL('/from_url/status/?token=nope', origin))
  expect(await response.json()).toEqual({ status: 'unknown' })
})

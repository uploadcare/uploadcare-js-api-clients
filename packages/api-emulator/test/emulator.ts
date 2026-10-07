import { createHash, createHmac } from 'node:crypto'
import {
  handle,
  SESSION_HEADER,
  SIGNED_UPLOADS_SECRET_KEY
} from '../src/index.js'

/**
 * The shortest bytes `imageSize` decodes as a real 1×1 JPEG: SOI, then an SOF0
 * frame header carrying the dimensions, then EOI. An image upload needs it to
 * come back with a non-null `image_info`, which the spec's `imageInfo` schema
 * requires (it isn't nullable, unlike its `video_info`/`content_info` siblings;
 * see README.md).
 */
export const JPEG_1X1 = new Uint8Array([
  0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0xff, 0xd9
])

type Session = { session?: string }

/** `handle()`, throwing instead of answering `undefined` when no route matches. */
export const call = async (
  input: string | URL | Request,
  init?: RequestInit,
  { session }: Session = {}
) => {
  const request = new Request(input, init)
  if (session !== undefined) request.headers.set(SESSION_HEADER, session)
  const response = await handle(request)
  if (!response)
    throw new Error(`no route answered ${request.method} ${request.url}`)
  return response
}

/** `POST /base/` with one file, answering the raw response. */
export const uploadFile = ({
  bytes = JPEG_1X1,
  name = 'a.jpg',
  type = 'image/jpeg',
  pubKey = 'demopublickey',
  fields = {},
  query = '',
  session
}: {
  bytes?: Uint8Array
  name?: string
  type?: string
  pubKey?: string
  fields?: Record<string, string>
  query?: string
} & Session = {}) => {
  const body = new FormData()
  body.set('UPLOADCARE_PUB_KEY', pubKey)
  for (const [key, value] of Object.entries(fields)) body.set(key, value)
  body.set('file', new File([bytes], name, { type }))
  return call(
    `https://upload.uploadcare.com/base/${query}`,
    { method: 'POST', body },
    { session }
  )
}

/** `uploadFile`, for a test that only needs the new file's uuid. */
export const upload = async (options?: Parameters<typeof uploadFile>[0]) =>
  ((await (await uploadFile(options)).json()) as { file: string }).file

/** `POST /group/` with `jsonerrors=1`. */
export const createGroup = (
  members: string[],
  { pubKey = 'demopublickey', session }: { pubKey?: string } & Session = {}
) => {
  const body = new FormData()
  body.set('pub_key', pubKey)
  members.forEach((member, index) => body.set(`files[${index}]`, member))
  return call(
    'https://upload.uploadcare.com/group/?jsonerrors=1',
    { method: 'POST', body },
    { session }
  )
}

export const now = () => Math.floor(Date.now() / 1000)

const encode = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString('base64url')

/**
 * HS256 keyed with `sha256(secret)`, the way `generateAuthToken` signs. Written
 * out rather than imported from `@uploadcare/signed-uploads`, so the verifier
 * isn't tested against the code it checks, and so a test can sign claims
 * `generateAuthToken` refuses to mint.
 */
export const sign = (
  claims: object,
  secret = SIGNED_UPLOADS_SECRET_KEY,
  protectedHeader: object = { alg: 'HS256', typ: 'JWT' }
) => {
  const header = encode(protectedHeader)
  const payload = encode(claims)
  const key = createHash('sha256').update(secret, 'utf8').digest()
  const signature = createHmac('sha256', key)
    .update(`${header}.${payload}`)
    .digest('base64url')
  return `${header}.${payload}.${signature}`
}

/** A token the emulator accepts: `claims` plus an `exp` ten minutes out. */
export const token = (claims: object = {}) =>
  sign({ exp: now() + 600, ...claims })

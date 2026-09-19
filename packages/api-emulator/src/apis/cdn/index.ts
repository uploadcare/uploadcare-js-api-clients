import { apiError } from '../../core/responses.js'
import { route } from '../../core/router.js'
import { type Session, type StoredFile, sessionOf } from '../../state/store.js'

/**
 * https://ucarecdn.com and the per-project cnames under `*.ucarecd.net`. Ported
 * from `blocks:tests/utils/fake-uploadcare/cdn.ts` — see that file for the
 * "operations are parsed but not applied" rationale, which holds here too:
 * `-/resize/500x/` gets the original bytes back at whatever size they were
 * uploaded, because the suites this backs assert on request URLs and response
 * shapes, never on pixels.
 *
 * The browser fake matches by host, since every project has its own cname and
 * there's no route table to register into. Here there is one, and the listening
 * server already answers on its own host — so this matches on path alone. That
 * also keeps a bare `/:uuid/*` pattern from swallowing the Upload API's own
 * paths: `index.ts` registers the Upload API first, and every route below
 * requires `/-/` or `/-/json/` after the id, which `/base/` and `/info/` never
 * have.
 *
 * Ponytail: ops ignored. If a test ever needs the delivered size to be real,
 * this is where a codec would go.
 */

/**
 * A bare file uuid, or a group id (`<uuid>~<count>`). Checked before anything
 * else below: the route pattern's `:uuid` segment is just "whatever's first,"
 * which would otherwise let this route claim `/base/` or `/info/` if it were
 * ever registered ahead of the Upload API (see `index.ts`'s import order) —
 * returning `undefined` here is "not a CDN request" as far as the router's
 * concerned, same as a path this route never matched at all.
 */
const CDN_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(~\d+)?$/i

/** `/:uuid/-/resize/500x/` and `/:group~3/nth/1/-/preview/`. */
const NTH = /(?:^|\/)nth\/(\d+)\//

const resolve = (session: Session, id: string, pathname: string) => {
  if (!id.includes('~')) return session.files.get(id)
  const members = session.groups.get(id)
  const nth = Number(pathname.match(NTH)?.[1] ?? 0)
  const member = members?.[nth]
  if (!member) return undefined
  // A group member may carry `/-/effects/` after its uuid (see `group.ts`'s
  // `parseMember`) — only the uuid identifies the stored file.
  return session.files.get(member.split('/')[0] ?? member)
}

/**
 * `-/json/` is metadata, not a rendition — the shape `fileInfo`'s image_info
 * uses.
 */
const jsonInfo = (file: StoredFile) =>
  file.image && {
    id: file.uuid,
    format: file.image.format,
    width: file.image.width,
    height: file.image.height,
    sequence: false,
    dpi: [72, 72],
    color_mode: 'RGB',
    orientation: null,
    geo_location: null,
    datetime_original: null
  }

route('GET', '/:uuid/*', ({ request, params }) => {
  if (!CDN_ID.test(params.uuid ?? '')) return undefined

  const { pathname } = new URL(request.url)
  const file = resolve(sessionOf(request), params.uuid ?? '', pathname)
  if (!file) return apiError(request, 404, 'File not found')

  if (pathname.includes('/-/json/')) {
    const info = jsonInfo(file)
    return info ? Response.json(info) : apiError(request, 400, 'Not an image')
  }

  return new Response(file.bytes, {
    headers: { 'content-type': file.mimeType }
  })
})

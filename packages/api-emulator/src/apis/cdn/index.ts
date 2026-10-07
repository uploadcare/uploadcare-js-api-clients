import { apiError } from '../../core/responses.js'
import { route, type Route } from '../../core/router.js'
import { type Session, imageInfo, sessionOf } from '../../state/store.js'

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
 * server already answers on its own host — so this matches on path alone, and
 * `CDN_ID` below keeps the bare `/:uuid/*` pattern off the Upload API's paths.
 *
 * Ponytail: ops ignored. If a test ever needs the delivered size to be real,
 * this is where a codec would go.
 */

/**
 * A bare file uuid, or a group id (`<uuid>~<count>`). Checked before anything
 * else below: the route pattern's `:uuid` segment is just "whatever's first,"
 * which also matches `/base/` and `/info/` — returning `undefined` hands the
 * request on to the next matching route, same as a path this route never
 * matched at all.
 */
const CDN_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(~\d+)?$/i

/** `/:uuid/-/resize/500x/` and `/:group~3/nth/1/-/preview/`. */
const NTH = /(?:^|\/)nth\/(\d+)\//

const resolve = (session: Session, id: string, pathname: string) => {
  if (!id.includes('~')) return session.files.get(id)
  const members = session.groups.get(id)
  const nth = Number(pathname.match(NTH)?.[1] ?? 0)
  const uuid = members?.[nth]?.uuid
  return uuid === undefined ? undefined : session.files.get(uuid)
}

export const cdnRoutes: Route[] = [
  route('GET', '/:uuid/*', ({ request, params }) => {
    if (!CDN_ID.test(params.uuid ?? '')) return undefined

    const { pathname } = new URL(request.url)
    const file = resolve(sessionOf(request), params.uuid ?? '', pathname)
    if (!file) return apiError(request, 404, 'File not found')

    if (pathname.includes('/-/json/')) {
      // Metadata, not a rendition: `/info/`'s `image_info`, plus the id.
      const info = imageInfo(file)
      return info
        ? Response.json({ id: file.uuid, ...info })
        : apiError(request, 400, 'Not an image')
    }

    // `mimeType` is whatever the uploader claimed, `text/html` included; the
    // sandbox keeps such a file from running script on the emulator's origin.
    // `<img>` and `fetch` consumers are unaffected.
    return new Response(file.bytes, {
      headers: {
        'content-type': file.mimeType,
        'content-security-policy': 'sandbox',
        'x-content-type-options': 'nosniff'
      }
    })
  })
]

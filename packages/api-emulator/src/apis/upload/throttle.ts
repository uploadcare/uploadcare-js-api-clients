import { apiError } from '../../core/responses.js'
import { route } from '../../core/router.js'
import { sessionOf } from '../../state/store.js'

/**
 * `/throttle/` — no route a real client ever calls; it exists so a client can
 * exercise its 429-retry path deliberately. Mirrors the old mock server's
 * `controllers/throttle.ts`: every second call succeeds, every other one
 * answers 429. Kept per-session (`Session.throttled`), not a single
 * module-level counter like the old server's — this suite runs many test files'
 * sessions concurrently against one fake (see store.ts), and a shared counter
 * would make one file's call flip another file's outcome.
 */
route(
  'POST',
  '/throttle/',
  ({ request }) => {
    const session = sessionOf(request)
    session.throttled += 1
    if (session.throttled < 2)
      // schema: requestThrottledError
      return apiError(request, 429, 'Request was throttled.')

    session.throttled = 0
    return new Response(null, { status: 200 })
  },
  { protected: true }
)

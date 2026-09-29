import error from '../utils/error'
import { type Middleware } from 'koa'

/**
 * Throttles the first request that asks to be throttled, so a test can put a
 * 429 in front of an upload without hammering anything.
 *
 * Opt in per request with the `mock_throttle` metadata key, whose value keys
 * the count, so concurrent tests do not spend each other's allowance:
 *
 *     uploadFile(file, { metadata: { mock_throttle: 'my-case' } })
 *
 * Real throttling cannot be provoked on demand against the Upload API, which is
 * why the case that needs it stays with this server.
 */
const METADATA_FIELD = 'metadata[mock_throttle]'

/** Seconds, echoed in `retry-after` so the client's wait is observable. */
const RETRY_AFTER_SECONDS = 1

const throttled = new Set<string>()

const throttleOnce: Middleware = (ctx, next) => {
  const key = ctx.request.body?.[METADATA_FIELD] as string | undefined

  if (!key || throttled.has(key)) {
    return next()
  }

  throttled.add(key)
  ctx.set('retry-after', String(RETRY_AFTER_SECONDS))
  error(ctx, {
    status: 429,
    statusText: 'Request was throttled.',
    errorCode: 'RequestThrottledError'
  })
  return undefined
}

export default throttleOnce

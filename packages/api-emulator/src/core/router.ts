import { requirePublicKey } from '../apis/upload/auth.js'

export type RouteHandler = (context: {
  request: Request
  params: Record<string, string>
}) => Response | undefined | Promise<Response | undefined>

/**
 * A protected route's public-key gate. `paramName` is also the field the public
 * key is read from on a body-sourced route (`UPLOADCARE_PUB_KEY` for `/base/`
 * and the multipart routes) — the same name a missing/invalid key is reported
 * under, since that's where each client actually puts it. Defaults to
 * `pub_key`, read from the query string, which is every other protected route's
 * shape. `'both'` is `/group/`'s: `upload-client` sends `pub_key` in the body,
 * the old mock server's fake sends it in the query string.
 */
export type ProtectedConfig = {
  paramName?: string
  source?: 'query' | 'body' | 'both'
}

type Route = {
  method: string
  segments: string[]
  handler: RouteHandler
  protected?: ProtectedConfig
}

const routes: Route[] = []

/**
 * `/multipart/upload/:uuid/original/` — `:name` captures one segment, a
 * trailing `*` captures the rest.
 *
 * `options.protected` marks a route the Upload API checks a public key on
 * before anything else — `true` for the query-string default, or a
 * `ProtectedConfig` for a route whose key lives in the body (or either).
 */
export const route = (
  method: string,
  path: string,
  handler: RouteHandler,
  options?: { protected?: ProtectedConfig | true }
) => {
  routes.push({
    method,
    segments: path.split('/').filter(Boolean),
    handler,
    protected: options?.protected === true ? {} : options?.protected
  })
}

const match = (candidate: Route, method: string, pathname: string) => {
  if (candidate.method !== method) return undefined
  const actual = pathname.split('/').filter(Boolean)
  const params: Record<string, string> = {}
  for (const [index, expected] of candidate.segments.entries()) {
    if (expected === '*')
      return { ...params, rest: actual.slice(index).join('/') }
    const value = actual[index]
    if (value === undefined) return undefined
    if (expected.startsWith(':')) params[expected.slice(1)] = value
    else if (expected !== value) return undefined
  }
  return actual.length === candidate.segments.length ? params : undefined
}

/**
 * The body's public key, read from a _clone_ of the request — the handler still
 * needs to read the real body itself afterwards, and a `Request`'s body can
 * only be consumed once.
 */
const bodyPublicKey = async (request: Request, paramName: string) => {
  const form = await request
    .clone()
    .formData()
    .catch(() => undefined)
  const value = form?.get(paramName)
  return typeof value === 'string' ? value : null
}

const extractPublicKey = async (
  request: Request,
  { paramName = 'pub_key', source = 'query' }: ProtectedConfig
): Promise<string | null> => {
  const fromQuery = () => new URL(request.url).searchParams.get('pub_key')
  if (source === 'query') return fromQuery()
  if (source === 'body') return bodyPublicKey(request, paramName)
  // 'both': body first, query as a fallback — what `/group/` did by hand.
  return (await bodyPublicKey(request, paramName)) ?? fromQuery()
}

/** The Upload API answers with or without the trailing slash, and so must this. */
export const handle = async (
  request: Request
): Promise<Response | undefined> => {
  const { pathname } = new URL(request.url)
  for (const candidate of routes) {
    const params = match(candidate, request.method, pathname)
    if (params) {
      if (candidate.protected) {
        const paramName = candidate.protected.paramName ?? 'pub_key'
        const publicKey = await extractPublicKey(request, candidate.protected)
        const authError = requirePublicKey(request, publicKey, paramName)
        if (authError) return authError
      }
      return (await candidate.handler({ request, params })) ?? undefined
    }
  }
  return undefined
}

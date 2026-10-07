export type RouteContext = {
  request: Request
  params: Record<string, string>
}

export type RouteHandler = (
  context: RouteContext
) => Response | undefined | Promise<Response | undefined>

export type Route = {
  method: string
  segments: string[]
  handler: RouteHandler
}

/**
 * `/multipart/upload/:uuid/original/` — `:name` captures one segment, a
 * trailing `*` captures the rest.
 */
export const route = (
  method: string,
  path: string,
  handler: RouteHandler
): Route => ({ method, segments: path.split('/').filter(Boolean), handler })

const matchRoute = (candidate: Route, method: string, pathname: string) => {
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
 * The first answer from `routes`, tried in order. The Upload API answers with
 * or without the trailing slash, and so must this.
 */
export const createRouter =
  (routes: readonly Route[]) =>
  async (request: Request): Promise<Response | undefined> => {
    const { pathname } = new URL(request.url)
    for (const candidate of routes) {
      const params = matchRoute(candidate, request.method, pathname)
      if (!params) continue
      // `undefined` is "not mine after all" — keep looking, so a broad
      // pattern (the CDN's `/:uuid/*`) can't shadow a later, narrower route.
      const answer = await candidate.handler({ request, params })
      if (answer) return answer
    }
    return undefined
  }

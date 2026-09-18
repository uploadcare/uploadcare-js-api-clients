export type RouteHandler = (context: {
  request: Request
  params: Record<string, string>
}) => Response | undefined | Promise<Response | undefined>

type Route = { method: string; segments: string[]; handler: RouteHandler }

const routes: Route[] = []

/**
 * `/multipart/upload/:uuid/original/` — `:name` captures one segment, a
 * trailing `*` captures the rest.
 */
export const route = (method: string, path: string, handler: RouteHandler) => {
  routes.push({ method, segments: path.split('/').filter(Boolean), handler })
}

const match = (route: Route, method: string, pathname: string) => {
  if (route.method !== method) return undefined
  const actual = pathname.split('/').filter(Boolean)
  const params: Record<string, string> = {}
  for (const [index, expected] of route.segments.entries()) {
    if (expected === '*')
      return { ...params, rest: actual.slice(index).join('/') }
    if (index >= actual.length) return undefined
    if (expected.startsWith(':')) params[expected.slice(1)] = actual[index]
    else if (expected !== actual[index]) return undefined
  }
  return actual.length === route.segments.length ? params : undefined
}

/** The Upload API answers with or without the trailing slash, and so must this. */
export const handle = async (
  request: Request
): Promise<Response | undefined> => {
  const { pathname } = new URL(request.url)
  for (const candidate of routes) {
    const params = match(candidate, request.method, pathname)
    if (params)
      return (await candidate.handler({ request, params })) ?? undefined
  }
  return undefined
}

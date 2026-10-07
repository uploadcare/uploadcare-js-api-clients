import type { EmulatorSession } from '../session.js'
import { matchPath, segmentsOf } from './router.js'

/**
 * `'METHOD /path/'`, in the routes' own path syntax (`:name` captures a
 * segment, a trailing `*` the rest), or any of the three on their own. `host`
 * is the URL's `host`, port included.
 */
export type ScenarioMatch =
  | string
  | { method?: string; path?: string; host?: string }

export type ScenarioContext = {
  /** A copy: reading its body leaves the real one for `next()`. */
  request: Request
  params: Record<string, string>
  session: EmulatorSession
  /**
   * Runs the rest of the chain (older scenarios, then the emulator's own route)
   * and answers what it answered, its state changes applied. Every call runs it
   * again. `undefined` only when nothing down the chain handles the request.
   */
  next: () => Promise<Response | undefined>
}

/** A `Response` answers the request; `undefined` falls through to the rest. */
export type ScenarioHandler = (
  context: ScenarioContext
) => Response | undefined | Promise<Response | undefined>

export type ScenarioOptions = {
  /** Answers this many requests, then is gone. Every request by default. */
  times?: number
}

export type Scenario = {
  /**
   * The path params when `request` is this scenario's, `undefined` when it
   * isn't.
   */
  paramsFor: (request: Request) => Record<string, string> | undefined
  handler: ScenarioHandler
  /** Uses left, claimed when a request matches; unlimited when absent. */
  remaining?: number
}

const parseMatch = (match: string): Exclude<ScenarioMatch, string> => {
  const [method, path, extra] = match.trim().split(/\s+/)
  if (!method || !path?.startsWith('/') || extra !== undefined)
    throw new TypeError(
      `A scenario match is 'METHOD /path/', got ${JSON.stringify(match)}`
    )
  return { method, path }
}

export const scenario = (
  match: ScenarioMatch,
  handler: ScenarioHandler,
  { times }: ScenarioOptions = {}
): Scenario => {
  if (times !== undefined && !(Number.isInteger(times) && times > 0))
    throw new TypeError(`times is a positive integer, got ${times}`)
  const { method, path, host } =
    typeof match === 'string' ? parseMatch(match) : match
  const segments = path === undefined ? undefined : segmentsOf(path)
  const paramsFor = (request: Request) => {
    const url = new URL(request.url)
    if (method !== undefined && method.toUpperCase() !== request.method)
      return undefined
    if (host !== undefined && host !== url.host) return undefined
    return segments ? matchPath(segments, url.pathname) : {}
  }
  return { paramsFor, handler, remaining: times }
}

/**
 * `request` through `scenarios`, most recently registered first, then
 * `fallback` (the routes). A use is claimed before the handler runs, so two
 * concurrent requests can't both take a scenario's last one, and given back
 * when the handler falls through.
 */
export const runScenarios = (
  scenarios: Scenario[],
  session: EmulatorSession,
  request: Request,
  fallback: (request: Request) => Promise<Response | undefined>
) => {
  const chain = scenarios.toReversed()
  const run = async (from: number): Promise<Response | undefined> => {
    for (let index = from; index < chain.length; index += 1) {
      const current = chain[index]!
      const params = current.paramsFor(request)
      if (!params || current.remaining === 0) continue
      if (current.remaining !== undefined) current.remaining -= 1

      let downstream: { answer: Response | undefined } | undefined
      const next = async () =>
        (downstream = { answer: await run(index + 1) }).answer
      const answer = await current.handler({
        request: request.clone(),
        params,
        session,
        next
      })
      if (answer) {
        const position = scenarios.indexOf(current)
        if (current.remaining === 0 && position !== -1)
          scenarios.splice(position, 1)
        return answer
      }
      if (current.remaining !== undefined) current.remaining += 1
      // The rest of the chain has already answered; running it again would
      // apply its state changes twice.
      if (downstream) return downstream.answer
    }
    return fallback(request.clone())
  }
  return run(0)
}

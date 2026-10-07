import {
  scenario,
  type ScenarioHandler,
  type ScenarioMatch,
  type ScenarioOptions
} from './core/scenarios.js'
import * as store from './state/store.js'
import type { StoredFile, TelemetryEvent } from './state/store.js'

/**
 * What a test may read back from a session. The store's own layout (jobs,
 * counters, the uuid sequence) stays internal, so changing it isn't a breaking
 * change.
 */
export type SessionView = {
  readonly files: ReadonlyMap<string, StoredFile>
  readonly telemetry: readonly TelemetryEvent[]
}

/** A session, and the per-test scenarios that steer it. */
export type EmulatorSession = SessionView & {
  /**
   * Puts `handler` in front of every request `match` covers, ahead of every
   * scenario registered before it. Answers the session, for chaining.
   */
  on(
    match: ScenarioMatch,
    handler: ScenarioHandler,
    options?: ScenarioOptions
  ): EmulatorSession
}

const handles = new WeakMap<store.Session, EmulatorSession>()

/** One handle per session, so a handler can tell its own session apart. */
export const handleOf = (session: store.Session): EmulatorSession => {
  const existing = handles.get(session)
  if (existing) return existing
  const handle: EmulatorSession = {
    files: session.files,
    telemetry: session.telemetry,
    on(match, handler, options) {
      session.scenarios.push(scenario(match, handler, options))
      return handle
    }
  }
  handles.set(session, handle)
  return handle
}

/**
 * Empties a session (or starts one), scenarios included, and answers its
 * handle. With no `id`, the `'default'` session.
 */
export const resetSession = (id?: string) => handleOf(store.resetSession(id))

/** The session `request` belongs to, by its `SESSION_HEADER`. */
export const sessionOf = (request: Request) =>
  handleOf(store.sessionOf(request))

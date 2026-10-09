import {
  scenario,
  type ScenarioHandler,
  type ScenarioMatch,
  type ScenarioOptions
} from './core/scenarios.js'
import { applyPreset, type PresetArgsOf, type PresetName } from './presets.js'
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
  /**
   * A clone of every request the session received, in arrival order, bodies
   * unread: the ones a scenario answered and the ones nothing answered too.
   * Kept until `resetSession()`, bodies and all, so reset between tests.
   */
  readonly requests: readonly Request[]
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
  /** Applies a preset (see `PresetArgs`). Answers the session, for chaining. */
  use<N extends PresetName>(name: N, ...args: PresetArgsOf<N>): EmulatorSession
}

const handles = new WeakMap<store.Session, EmulatorSession>()

/** One handle per session, so a handler can tell its own session apart. */
export const handleOf = (session: store.Session): EmulatorSession => {
  const existing = handles.get(session)
  if (existing) return existing
  const handle: EmulatorSession = {
    get files() {
      return session.files
    },
    get telemetry() {
      return session.telemetry
    },
    get requests() {
      return session.requests
    },
    on(match, handler, options) {
      session.scenarios.push(scenario(match, handler, options))
      return handle
    },
    use(name, ...args) {
      applyPreset(session, handle, name, ...args)
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

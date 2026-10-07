import { afterAll, beforeEach } from 'vitest'
import { resetSession } from '@uploadcare/api-emulator'
import { createEmulatorServer } from '@uploadcare/api-emulator/listen'

/**
 * Vitest setup file: every test file starts its own emulator on a free port,
 * and every test gets a fresh session, so a test steers it with
 * `resetSession().use()`/`.on()` and nothing leaks into the next one. The
 * development settings in `_helpers.ts` point at `emulatorOrigin`; the
 * production run talks to the real API instead, and a preset a test applies
 * there changes nothing.
 */
export let emulatorOrigin = ''

if (process.env.TEST_ENV !== 'production') {
  const { origin, close } = await createEmulatorServer()
  emulatorOrigin = origin
  afterAll(close)
  beforeEach(() => {
    resetSession()
  })
}

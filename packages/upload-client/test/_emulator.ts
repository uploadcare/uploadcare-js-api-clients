import { EMULATOR_PORT, resetSession } from '@uploadcare/api-emulator'
import { createEmulatorServer } from '@uploadcare/api-emulator/listen'

/**
 * TEMPORARY: the emulator dropped its magic values for per-test presets, and
 * this suite hasn't moved to them yet. Until it does, these scenarios give the
 * old values their old meaning on the default session, which every test file
 * here shares.
 */
const legacyScenarios = () => {
  const spentThrottleKeys = new Set<string>()
  resetSession().on('POST /base/', async ({ request }) => {
    const key = (await request.formData()).get('metadata[mock_throttle]')
    if (typeof key !== 'string' || spentThrottleKeys.has(key)) return undefined
    spentThrottleKeys.add(key)
    return Response.json(
      {
        error: {
          status_code: 429,
          content: 'Request was throttled.',
          error_code: 'RequestThrottledError'
        }
      },
      { headers: { 'retry-after': '1' } }
    )
  })
}

// Vitest globalSetup: the development settings in `_helpers.ts` point at this
// server; the production run talks to the real API instead.
export default async function setup() {
  if (process.env.TEST_ENV === 'production') return
  const { close } = await createEmulatorServer({ port: EMULATOR_PORT })
  legacyScenarios()
  return close
}

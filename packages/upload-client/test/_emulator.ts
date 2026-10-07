import { EMULATOR_PORT } from '@uploadcare/api-emulator'
import { createEmulatorServer } from '@uploadcare/api-emulator/listen'
import { legacyScenarios } from './_emulatorLegacy'

// Vitest globalSetup: the development settings in `_helpers.ts` point at this
// server; the production run talks to the real API instead.
export default async function setup() {
  if (process.env.TEST_ENV === 'production') return
  const { close } = await createEmulatorServer({ port: EMULATOR_PORT })
  legacyScenarios()
  return close
}

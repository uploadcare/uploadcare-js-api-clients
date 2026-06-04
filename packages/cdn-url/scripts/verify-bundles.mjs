/**
 * Post-build sanity check for the dual-bundle setup:
 * - the development bundle must contain the validation errors,
 * - the production bundle must not (checks are stripped by DCE),
 * - no `__DEV__` identifier may survive in either flavor.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname

function read(flavor) {
  const dir = join(root, 'dist', flavor)
  return readdirSync(dir)
    .filter((f) => f.endsWith('.js') || f.endsWith('.cjs'))
    .map((f) => readFileSync(join(dir, f), 'utf8'))
    .join('\n')
}

const dev = read('dev')
const prod = read('prod')

const failures = []

// Marker messages that only exist inside __DEV__-guarded assertions.
const DEV_MARKERS = [
  'must be an integer in',
  'must be one of',
  'preview requires either no dimensions or both',
  'must be a multiple of 90'
]

for (const marker of DEV_MARKERS) {
  if (!dev.includes(marker)) {
    failures.push(`dev bundle is missing validation marker: "${marker}"`)
  }
  if (prod.includes(marker)) {
    failures.push(`prod bundle still contains validation marker: "${marker}"`)
  }
}

for (const [flavor, code] of [
  ['dev', dev],
  ['prod', prod]
]) {
  if (code.includes('__DEV__')) {
    failures.push(`${flavor} bundle contains an unreplaced __DEV__ identifier`)
  }
}

if (failures.length > 0) {
  console.error('Bundle verification failed:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('Bundle verification passed: dev has checks, prod is clean.')

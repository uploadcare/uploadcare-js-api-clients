/**
 * Post-build sanity check for the dual-bundle setup:
 * - the development bundle must contain the validation errors,
 * - the production bundle must not (checks are stripped by DCE),
 * - no `__DEV__` identifier may survive in either flavor,
 * - `@uploadcare/cname-prefix` stays an import in the library bundles and is
 *   inlined only in the self-contained IIFE.
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

/**
 * The dependency ships a build per environment behind export conditions, so
 * inlining it here would freeze whichever one this machine resolved into the
 * published output. It must survive as a bare specifier in the library bundles;
 * the IIFE has no importer to resolve it, so there it must be inlined.
 */
const CNAME_PREFIX_SPECIFIER = '@uploadcare/cname-prefix'
// Only the browser build of the dependency contains this, so its presence in a
// library bundle means that build got baked in.
const BROWSER_DIGEST_MARKER = 'crypto.subtle'

for (const flavor of ['dev', 'prod']) {
  // Per file, not per flavor: the specifier only belongs to the cdn-base
  // entry, and joining every file would let one surviving import vouch for the
  // rest.
  for (const ext of ['js', 'cjs']) {
    const entry = join(root, 'dist', flavor, `cdn-base.${ext}`)
    if (!readFileSync(entry, 'utf8').includes(CNAME_PREFIX_SPECIFIER)) {
      failures.push(
        `${flavor}/cdn-base.${ext} does not import ${CNAME_PREFIX_SPECIFIER} — it was inlined, so the consumer cannot resolve its export conditions`
      )
    }
  }
  const code = flavor === 'dev' ? dev : prod
  if (code.includes(BROWSER_DIGEST_MARKER)) {
    failures.push(
      `${flavor} bundle inlines the browser digest of ${CNAME_PREFIX_SPECIFIER}`
    )
  }
}

const iife = readFileSync(join(root, 'dist', 'cdn-url.global.js'), 'utf8')
if (iife.includes(CNAME_PREFIX_SPECIFIER)) {
  failures.push(
    `iife bundle imports ${CNAME_PREFIX_SPECIFIER}; a <script> global has to be self-contained`
  )
}
if (!iife.includes(BROWSER_DIGEST_MARKER)) {
  failures.push('iife bundle is missing the inlined browser digest')
}

if (failures.length > 0) {
  console.error('Bundle verification failed:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log(
  'Bundle verification passed: dev has checks, prod is clean, cname-prefix external in both and inlined in the iife.'
)

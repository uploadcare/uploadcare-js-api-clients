/**
 * Drift detector: downloads the published Upload API OpenAPI document and exits
 * non-zero if it differs from the committed snapshot, without writing anything.
 * Needs network and a fresh presigned URL, so it is never run as part of `npm
 * test`, the build, or CI's default path — only by hand, when someone wants to
 * know whether the API moved.
 *
 * Usage: npm run spec:check -- <presigned-url>
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fetchSpec, formatWithOxfmt, requireUrlArg } from './spec-lib.ts'

const url = requireUrlArg('spec:check', process.argv)
const specPath = path.join(
  import.meta.dirname,
  '..',
  'test',
  'specs',
  'upload-api.json'
)
const committed = readFileSync(specPath, 'utf8')

const { document, version } = await fetchSpec(url)

// Into a temp file, formatted the same way the committed snapshot is, so a
// diff here means an actual content difference rather than a formatting one.
const tempDir = mkdtempSync(path.join(tmpdir(), 'upload-api-spec-'))
const tempPath = path.join(tempDir, 'upload-api-spec.json')
let fresh: string
try {
  writeFileSync(tempPath, `${JSON.stringify(document, null, 2)}\n`)
  formatWithOxfmt(tempPath)
  fresh = readFileSync(tempPath, 'utf8')
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}

if (fresh !== committed) {
  console.error(
    `test/specs/upload-api.json is stale (published info.version is ${version}). ` +
      'Run `npm run spec:refresh -- <url>` and commit the result.'
  )
  process.exit(1)
}

console.log(
  `test/specs/upload-api.json matches the published spec (info.version ${version}).`
)

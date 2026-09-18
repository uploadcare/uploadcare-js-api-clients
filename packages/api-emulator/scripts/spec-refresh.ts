/**
 * Downloads the published Upload API OpenAPI document and writes it as the
 * committed snapshot the tests validate against. Needs network and a fresh
 * presigned URL, so it is never run as part of `npm test`, the build, or CI's
 * default path — only by hand.
 *
 * Usage: npm run spec:refresh -- <presigned-url>
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fetchSpec, formatWithOxfmt, requireUrlArg } from './spec-lib.ts'

const url = requireUrlArg('spec:refresh', process.argv)
const testDir = path.join(import.meta.dirname, '..', 'test')
const specPath = path.join(testDir, 'upload-api-spec.json')
const metaPath = path.join(testDir, 'upload-api-spec.meta.json')

const { document, version, sha256, strippedUrl } = await fetchSpec(url)

writeFileSync(specPath, `${JSON.stringify(document, null, 2)}\n`)
writeFileSync(
  metaPath,
  `${JSON.stringify(
    {
      version,
      sha256,
      fetchedAt: new Date().toISOString().slice(0, 10),
      url: strippedUrl
    },
    null,
    2
  )}\n`
)
// So the committed snapshot passes `format:check` without a separate step.
formatWithOxfmt(specPath)
formatWithOxfmt(metaPath)

console.log(
  `Wrote ${path.relative(process.cwd(), specPath)} (info.version ${version}, sha256 ${sha256.slice(0, 12)}…)`
)

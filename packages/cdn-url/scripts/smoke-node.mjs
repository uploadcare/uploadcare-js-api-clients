/**
 * Post-build smoke test: resolves and exercises every entry point in plain
 * Node, through both module systems, against the real dist output. Catches
 * broken exports-map paths, ESM/CJS interop slips and runtime errors that
 * unit tests (which run against source) cannot.
 */
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distUrl = (rel) => pathToFileURL(resolve(pkgRoot, 'dist', rel))

const require = createRequire(import.meta.url)
const UUID = 'c2499162-eb07-4b93-b31e-94a89a47e858'

const checks = []
const check = (name, fn) => checks.push([name, fn])

const entries = [
  'index',
  'ops',
  'video',
  'document',
  'gif2video',
  'group',
  'proxy',
  'builder',
  'fluent',
  'validate'
]

for (const entry of entries) {
  for (const flavor of ['dev', 'prod']) {
    check(`esm ${flavor}/${entry}`, async () => {
      const mod = await import(distUrl(`${flavor}/${entry}.js`))
      if (Object.keys(mod).length === 0) throw new Error('no exports')
    })
    check(`cjs ${flavor}/${entry}`, () => {
      const mod = require(`../dist/${flavor}/${entry}.cjs`)
      if (Object.keys(mod).length === 0) throw new Error('no exports')
    })
  }
}

check('core roundtrip (prod esm)', async () => {
  const { parseCdnUrl, serializeCdnUrl } = await import(
    distUrl('prod/index.js')
  )
  const url = `https://ucarecdn.com/${UUID}/-/resize/300x/photo.jpg`
  if (serializeCdnUrl(parseCdnUrl(url)) !== url)
    throw new Error('roundtrip mismatch')
})

check('fluent chain (prod cjs)', () => {
  const { cdn } = require('../dist/prod/fluent.cjs')
  const href = cdn.file(UUID).preview(800, 600).quality('smart').href
  const expected = `https://ucarecdn.com/${UUID}/-/preview/800x600/-/quality/smart/`
  if (href !== expected) throw new Error(`fluent mismatch: ${href}`)
})

check('dev bundle still validates (dev esm)', async () => {
  const { quality } = await import(distUrl('dev/ops.js'))
  try {
    quality('ultra')
    throw new Error('expected RangeError')
  } catch (e) {
    if (!(e instanceof RangeError)) throw e
  }
})

check('iife global', async () => {
  const { readFileSync } = await import('node:fs')
  const code = readFileSync(resolve(pkgRoot, 'dist/cdn-url.global.js'), 'utf8')
  const fn = new Function(`${code}; return UCCdnUrl`)
  const global = fn()
  const href = global.cdn.file(UUID).preview().href
  if (href !== `https://ucarecdn.com/${UUID}/-/preview/`)
    throw new Error('iife mismatch')
})

let failed = 0
for (const [name, fn] of checks) {
  try {
    await fn()
  } catch (error) {
    failed += 1
    console.error(`✘ ${name}: ${error.message}`)
  }
}

if (failed > 0) {
  console.error(`Node smoke failed: ${failed}/${checks.length}`)
  process.exit(1)
}
console.log(
  `Node smoke passed: ${checks.length} checks (esm+cjs × dev+prod × ${entries.length} entries, iife).`
)

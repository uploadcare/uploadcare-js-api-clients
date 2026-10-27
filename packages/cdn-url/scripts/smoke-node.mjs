/**
 * Post-build smoke test: resolves and exercises every entry point in plain
 * Node against the real dist output. Catches broken exports-map paths and
 * runtime errors that unit tests (which run against source) cannot.
 */
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distUrl = (rel) => pathToFileURL(resolve(pkgRoot, 'dist', rel))

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
  'validate',
  'tiny'
]

for (const entry of entries) {
  for (const flavor of ['dev', 'prod']) {
    check(`esm ${flavor}/${entry}`, async () => {
      const mod = await import(distUrl(`${flavor}/${entry}.js`))
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

check('fluent chain (prod esm)', async () => {
  const { cdn } = await import(distUrl('prod/fluent.js'))
  // The host helpers are their own entry now; the iife keeps them on the global.
  const { prefixedCdnBase } = await import(distUrl('prod/cdn-base.js'))
  const myCdn = cdn.base(prefixedCdnBase('demopublickey'))
  const href = myCdn.file(UUID).preview(800, 600).quality('smart').href
  const expected = `https://1s4oyld5dc.ucarecd.net/${UUID}/-/preview/800x600/-/quality/smart/`
  if (href !== expected) throw new Error(`fluent mismatch: ${href}`)
})

check('structural guards survive minification (prod esm)', async () => {
  const { cdn } = await import(distUrl('prod/fluent.js'))
  // A url cannot address a file without a host: this must throw in the
  // production flavor too, not fall back to some default domain.
  const throws = (fn) => {
    try {
      fn()
      return false
    } catch {
      return true
    }
  }
  if (!throws(() => cdn.base('')))
    throw new Error('prod: cdn.base("") did not throw')
  if (!throws(() => cdn.file(UUID)))
    throw new Error('prod: unbound cdn.file() did not throw')
})

check('updateOperations no-ops rather than corrupts (prod esm)', async () => {
  const { cdn } = await import(distUrl('prod/fluent.js'))
  const chain = cdn.base('https://x.ucarecd.net').file(UUID).preview(800, 600)
  // Production strips the dev throw; the callback contract must degrade to
  // "chain unchanged", never to `operations: undefined`.
  const href = chain.updateOperations(() => undefined).href
  if (href !== `https://x.ucarecd.net/${UUID}/-/preview/800x600/`)
    throw new Error(`prod updateOperations mangled the chain: ${href}`)
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

check('cdn-base entry (prod esm, node condition)', async () => {
  const { prefixedCdnBase, prefixedCdnBaseAsync } = await import(
    distUrl('prod/cdn-base.js')
  )
  const expected = 'https://1s4oyld5dc.ucarecd.net'
  if (prefixedCdnBase('demopublickey') !== expected)
    throw new Error('cdn-base mismatch')
  // The dependency's node build computes the async prefix with node:crypto's
  // WebCrypto, so the async helper agrees with the sync one here.
  if ((await prefixedCdnBaseAsync('demopublickey')) !== expected)
    throw new Error('cdn-base async mismatch')
})

check('iife global', async () => {
  const { readFileSync } = await import('node:fs')
  const code = readFileSync(resolve(pkgRoot, 'dist/cdn-url.global.js'), 'utf8')
  const fn = new Function(`${code}; return UCCdnUrl`)
  const global = fn()
  const href = global.cdn
    .base(global.prefixedCdnBase('demopublickey'))
    .file(UUID)
    .preview().href
  if (href !== `https://1s4oyld5dc.ucarecd.net/${UUID}/-/preview/`)
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
  `Node smoke passed: ${checks.length} checks (esm × dev+prod × ${entries.length} entries, iife).`
)

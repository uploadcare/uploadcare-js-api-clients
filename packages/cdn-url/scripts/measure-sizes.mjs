/**
 * Measures the bundle sizes the docs publish, so they are re-measured rather than
 * copied forward. Bundles a small consumer of the production build with esbuild
 * `--minify` and reports raw, gzip (level 9) and brotli bytes. Run after
 * `npm run build`: `node scripts/measure-sizes.mjs`.
 */
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const prod = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/prod')
const URL_ = `'https://ucarecdn.com/c2499162-eb07-4b93-b31e-94a89a47e858/-/resize/300x/photo.jpg'`

async function measure(code, platform = 'browser') {
  const result = await build({
    stdin: { contents: code, resolveDir: prod, loader: 'js' },
    bundle: true,
    minify: true,
    format: 'esm',
    platform,
    write: false,
    logLevel: 'error'
  })
  const bytes = result.outputFiles[0].contents
  return {
    raw: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes).length
  }
}

const kB = (n) => `${(n / 1000).toFixed(1)} kB`
const row = (label, { raw, gzip, brotli }) =>
  console.log(
    `${label.padEnd(44)} ${kB(raw).padStart(8)} ${kB(gzip).padStart(8)}   (${raw} / ${gzip} / ${brotli} B)`
  )

console.log('Entries: import everything an entry exports (raw / gzip / brotli)')
for (const entry of [
  'proxy',
  'document',
  'video',
  'gif2video',
  'group',
  'validate',
  'builder',
  'tiny',
  'index',
  'ops',
  'fluent',
  'cdn-base'
]) {
  row(entry, await measure(`export * from './${entry}.js'`))
}

console.log('\nOne task: parse a url, add one operation, serialize')
const tasks = {
  'fluent: cdn.parse → .blur(10) → .href': `import { cdn } from './fluent.js'
    const c = cdn.parse(${URL_}); if (c.kind === 'file') console.log(c.blur(10).href)`,
  'builder: CdnUrl.parse().with(blur(10))': `import { CdnUrl } from './builder.js'; import { blur } from './ops.js'
    console.log(CdnUrl.parse(${URL_}).with(blur(10)).href)`,
  'functional, any kind': `import { parseCdnUrl, serializeCdnUrl } from './index.js'; import { blur } from './ops.js'
    const p = parseCdnUrl(${URL_}); if (p.kind === 'file') console.log(serializeCdnUrl({ ...p, operations: [...p.operations, blur(10)] }))`,
  // A check and no operation, so this row is a floor rather than like-for-like.
  'string level, kind unknown (isFileUrl)': `import { isFileUrl, tinyBuild, tinyParse } from './index.js'
    const u = ${URL_}; if (isFileUrl(u)) console.log(tinyBuild(tinyParse(u)))`,
  'functional, file only': `import { parseFileUrl, serializeFileUrl } from './index.js'; import { blur } from './ops.js'
    const p = parseFileUrl(${URL_}); console.log(serializeFileUrl({ ...p, operations: [...p.operations, blur(10)] }))`,
  'string level, kind known': `import { joinModifiers, modifiers, tinyBuild, tinyParse } from './tiny.js'
    const p = tinyParse(${URL_}); console.log(tinyBuild({ ...p, modifiers: joinModifiers(p.modifiers, modifiers('blur/10')) }))`,
  'string level, untrusted input': `import { joinModifiers, normalizeModifiers, tinyBuild, tinyParse } from './tiny.js'
    const p = tinyParse(${URL_}); console.log(tinyBuild({ ...p, modifiers: joinModifiers(p.modifiers, normalizeModifiers(globalThis.stored)) }))`,
  'string level through the root entry': `import { joinModifiers, modifiers, tinyBuild, tinyParse } from './index.js'
    const p = tinyParse(${URL_}); console.log(tinyBuild({ ...p, modifiers: joinModifiers(p.modifiers, modifiers('blur/10')) }))`
}
for (const [label, code] of Object.entries(tasks))
  row(label, await measure(code))

console.log('\nThe prefixed host')
const chain = `cdn.file('c2499162-eb07-4b93-b31e-94a89a47e858').preview(1, 1).href`
row(
  'cdn + one chain, literal host',
  await measure(
    `import { cdn } from './fluent.js'; console.log(cdn.base('https://x.ucarecd.net').${chain.slice(4)})`
  )
)
row(
  'cdn + one chain, prefixedCdnBase',
  await measure(
    `import { cdn } from './fluent.js'; import { prefixedCdnBase } from './cdn-base.js'
    console.log(cdn.base(prefixedCdnBase('k')).${chain.slice(4)})`
  )
)
// Marginal cost over a bundle that already has `cdn` and one chain.
const withChain = (helper) =>
  `import { cdn } from './fluent.js'${helper ? `; import { ${helper} } from './cdn-base.js'` : ''}
  console.log(cdn.base('https://x.ucarecd.net').file('c2499162-eb07-4b93-b31e-94a89a47e858').preview(1, 1).href${helper ? `, ${helper}` : ''})`
for (const platform of ['browser', 'node']) {
  const base = await measure(withChain(null), platform)
  for (const name of ['prefixedCdnBaseAsync', 'prefixedCdnBase']) {
    const size = await measure(withChain(name), platform)
    console.log(
      `${`${platform} ${name}`.padEnd(44)} +${size.brotli - base.brotli} B brotli`
    )
  }
}

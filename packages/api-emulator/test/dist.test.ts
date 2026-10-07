import { readFileSync } from 'node:fs'
import { builtinModules } from 'node:module'
import path from 'node:path'
import { expect, it } from 'vitest'

/**
 * Everything reachable from the `.` export has to run in a browser: MSW's
 * worker executes handlers in the page, so a `node:` import or a `Buffer` there
 * is not a style problem, it is a bundle that will not build. Node-only code
 * belongs behind the `./listen` export.
 *
 * The builtin-import check is driven by Node's own `builtinModules` list rather
 * than a hand-picked spelling: it catches any builtin, quoted either way, with
 * or without the `node:` prefix, so it can't drift from what Node actually
 * considers built in.
 */
const BUILTIN_IMPORT = new RegExp(
  `\\bimport\\b[^'"]*['"](?:node:)?(?:${builtinModules.join('|')})['"]`
)
const FORBIDDEN = [
  BUILTIN_IMPORT,
  /\bBuffer\b/,
  // `process` in any shape, not just `process.foo`: `const { env } = process`
  // and `globalThis.process` are just as fatal in a bundle.
  /\bprocess\b/,
  /\bglobal\b(?!This)/,
  /\brequire\s*\(/,
  /\b__dirname\b/,
  /\b__filename\b/
]

/**
 * MSW is an optional peer of `./browser` alone: a `.` or `./listen` consumer
 * never installs it, so any other entry reaching it is a bundle that won't
 * resolve.
 */
const MSW_IMPORT = /\bfrom\s*['"](?:msw|@mswjs\/)/

/**
 * Walk the built `dist/` import graph from an entry, the way a consumer's
 * bundler would, and scan exactly what that reaches: a shared chunk Rollup
 * merges can pull Node-only code in even when every source module looks fine.
 * `pretest` builds `dist/` first, so a missing build fails here rather than
 * skipping.
 */
const distRoot = path.join(import.meta.dirname, '../dist')

const distGraph = (entry: string, seen = new Set<string>()): Set<string> => {
  if (seen.has(entry)) return seen
  seen.add(entry)
  const source = readFileSync(entry, 'utf8')
  for (const match of source.matchAll(/from\s*["'](\.\/[^"']+)["']/g)) {
    distGraph(path.join(path.dirname(entry), match[1]), seen)
  }
  return seen
}

const offendersFrom = (entry: string, patterns: RegExp[]) =>
  [...distGraph(path.join(distRoot, entry))].flatMap((file) =>
    patterns
      .filter((pattern) => pattern.test(readFileSync(file, 'utf8')))
      .map((pattern) => `${path.relative(distRoot, file)} matches ${pattern}`)
  )

it.each(['index.js', 'browser.js'])(
  'keeps the built %s bundle free of node built-ins',
  (entry) => {
    expect(offendersFrom(entry, FORBIDDEN)).toEqual([])
  }
)

it.each(['index.js', 'listen.js'])(
  'keeps the built %s bundle free of msw',
  (entry) => {
    expect(offendersFrom(entry, [MSW_IMPORT])).toEqual([])
  }
)

/**
 * A tree-shaking setting can drop every route from `dist/index.js` while it
 * still builds clean, exports `handle` and typechecks. Only importing the built
 * artifact catches that.
 */
it('answers real requests from the built "." bundle, across all three APIs', async () => {
  const { handle } = await import(path.join(distRoot, 'index.js'))
  // Seeded by every fresh session (see DEMO_FILES in state/store.ts) —
  // exists without needing an upload first.
  const seededUuid = '49b4c5a1-31b3-4349-ba07-d97a2d883c37'

  const cdn = await handle(new Request(`https://ucarecdn.com/${seededUuid}/`))
  expect(cdn?.status).toBe(200)

  const uploadInfo = await handle(
    new Request(
      `https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=${seededUuid}`
    )
  )
  expect(uploadInfo?.status).toBe(200)

  const telemetry = await handle(
    new Request('https://tlm.uploadcare.com/api/v1/events', {
      method: 'POST',
      body: JSON.stringify({ event: 'test' })
    })
  )
  expect(telemetry?.status).toBe(200)
})

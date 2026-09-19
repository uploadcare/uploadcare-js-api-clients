import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
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
/**
 * Exempt paths, _relative to `src/`_ rather than by basename: a basename set
 * would silently exempt a future `src/apis/cdn/cli.ts` too, which has nothing
 * to do with the Node-only `./listen` export.
 */
const NODE_ONLY = new Set(['listen.ts', 'cli.ts'])
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

const sourceFiles = (dir: string, prefix = ''): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    const relative = prefix ? `${prefix}/${entry}` : entry
    if (statSync(full).isDirectory()) return sourceFiles(full, relative)
    return full.endsWith('.ts') && !NODE_ONLY.has(relative) ? [full] : []
  })

const root = path.join(import.meta.dirname, '../src')

it('keeps every module behind the "." export free of node built-ins', () => {
  const offenders = sourceFiles(root).flatMap((file) =>
    FORBIDDEN.filter((pattern) => pattern.test(readFileSync(file, 'utf8'))).map(
      (pattern) => `${path.relative(root, file)} matches ${pattern}`
    )
  )
  expect(offenders).toEqual([])
})

/**
 * The source-level check above can't see what bundling actually pulls in: a
 * shared chunk that only looks fine in isolation could still end up reachable
 * from both entry points once Rollup merges things. So walk the real `dist/`
 * import graph from `index.js`, the same way a consumer's bundler would, and
 * scan exactly what that reaches.
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

it.runIf(existsSync(distRoot))(
  'keeps the built "." bundle free of node built-ins',
  () => {
    const files = distGraph(path.join(distRoot, 'index.js'))
    const offenders = [...files].flatMap((file) =>
      FORBIDDEN.filter((pattern) =>
        pattern.test(readFileSync(file, 'utf8'))
      ).map((pattern) => `${path.relative(distRoot, file)} matches ${pattern}`)
    )
    expect(offenders).toEqual([])
  }
)

/**
 * The regression this repo actually shipped (PR #586): `sideEffects: false`
 * plus Rollup's `treeshake: 'smallest'` preset (which sets `moduleSideEffects:
 * false`) tree-shook away the side-effect-only imports in `index.ts` that
 * register every route. `dist/index.js` built clean, exported `handle`,
 * typechecked — and answered nothing. A source-level test can't catch this:
 * `src/index.ts` still has the imports, tree-shaking is a build step. This has
 * to import the actual built artifact and prove it answers.
 */
it.runIf(existsSync(distRoot))(
  'answers real requests from the built "." bundle, across all three APIs',
  async () => {
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
  }
)

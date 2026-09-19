import { readdirSync, readFileSync, statSync } from 'node:fs'
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
const NODE_ONLY = new Set(['listen.ts', 'cli.ts'])
const BUILTIN_IMPORT = new RegExp(
  `\\bimport\\b[^'"]*['"](?:node:)?(?:${builtinModules.join('|')})['"]`
)
const FORBIDDEN = [
  BUILTIN_IMPORT,
  /\bBuffer\b/,
  /\bprocess\.\w/,
  /\b__dirname\b/
]

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return full.endsWith('.ts') && !NODE_ONLY.has(entry) ? [full] : []
  })

it('keeps every module behind the "." export free of node built-ins', () => {
  const offenders = sourceFiles(
    path.join(import.meta.dirname, '../src')
  ).flatMap((file) =>
    FORBIDDEN.filter((pattern) => pattern.test(readFileSync(file, 'utf8'))).map(
      (pattern) => `${path.basename(file)} matches ${pattern}`
    )
  )
  expect(offenders).toEqual([])
})

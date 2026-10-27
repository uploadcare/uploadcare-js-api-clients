import { expect, it } from 'vitest'
import * as root from '../index'
import * as tiny from './index'

/**
 * Both import paths are public API — `/tiny` (what the docs show) and the root
 * entry (for callers who already import from there). This fails if either drifts:
 * a symbol added to `src/tiny/index.ts` and not re-exported from the root, or
 * removed from one side only.
 */
it('the root entry re-exports every string-level symbol, identically', () => {
  const fromRoot: Record<string, unknown> = { ...root }
  const fromTiny: Record<string, unknown> = { ...tiny }

  expect(Object.keys(fromTiny).length).toBeGreaterThan(0)
  for (const [name, value] of Object.entries(fromTiny)) {
    expect(fromRoot[name]).toBe(value)
  }
})

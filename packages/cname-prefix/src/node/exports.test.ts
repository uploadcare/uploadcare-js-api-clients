import { describe, expect, it } from 'vitest'

import * as browserAsync from '../async/index'
import * as browserRoot from '../index'
import * as browserSync from '../sync/index'
import * as nodeAsync from './async'
import * as nodeRoot from './index'
import * as nodeSync from './sync'

/**
 * `@uploadcare/cname-prefix/sync` is one module specifier that resolves to two
 * files, and the published types are generated from the browser one. An export
 * present under only the `node` condition therefore has no types and disappears
 * when the same code is bundled for a browser, so the two sides have to publish
 * the same names.
 */
describe('the node build publishes the same names as the browser build', () => {
  it.each([
    ['.', browserRoot, nodeRoot],
    ['./sync', browserSync, nodeSync],
    ['./async', browserAsync, nodeAsync]
  ])('%s', (_subpath, browser, node) => {
    expect(Object.keys(node).sort()).toEqual(Object.keys(browser).sort())
  })
})

import { describe, it, expect } from 'vitest'
import { isNode } from './isNode'

/** TODO: add test inside playwright */

describe('isNode', () => {
  it('should return true', () => {
    expect(isNode()).toBe(true)
  })
})

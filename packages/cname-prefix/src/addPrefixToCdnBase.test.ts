import { addPrefixToCdnBase } from './addPrefixToCdnBase'
import { describe, it, expect } from 'vitest'

describe('addPrefixToCdnBase', () => {
  it('should prepend the prefix to the CDN base URL', () => {
    const prefix = 'example'
    const cdnBase = 'https://ucarecdn.com'
    const expected = 'https://example.ucarecdn.com'
    expect(addPrefixToCdnBase(prefix, cdnBase)).toBe(expected)
  })
})

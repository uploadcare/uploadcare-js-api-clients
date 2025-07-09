import { isPrefixedCdnBase } from './isPrefixedCdnBase'
import { describe, it, expect } from 'vitest'

describe('isPrefixedCdnBase', () => {
  it('should return true for a prefixed CDN base', () => {
    const cdnBase = 'https://prefix.ucarecd.net'
    const prefixCdnBase = 'https://ucarecd.net'
    expect(isPrefixedCdnBase(cdnBase, prefixCdnBase)).toBe(true)
  })

  it('should return false for a non-prefixed CDN base', () => {
    const cdnBase = 'https://ucarecdn.com'
    const prefixCdnBase = 'https://ucarecd.net'
    expect(isPrefixedCdnBase(cdnBase, prefixCdnBase)).toBe(false)
  })

  it('should return false for an invalid URL', () => {
    const cdnBase = 'invalid-url'
    const prefixCdnBase = 'https://ucarecd.net'
    expect(isPrefixedCdnBase(cdnBase, prefixCdnBase)).toBe(false)
  })

  it('should return false for a CDN base with an unexpected format', () => {
    const cdnBase = 'https://ucarecdn.com/some/path'
    const prefixCdnBase = 'https://ucarecd.net'
    expect(isPrefixedCdnBase(cdnBase, prefixCdnBase)).toBe(false)
  })

  it('should return false for a prefix that does not match the CDN base origin', () => {
    const cdnBase = 'https://prefix.ucarecdn.com'
    const prefixCdnBase = 'https://ucarecd.net'
    expect(isPrefixedCdnBase(cdnBase, prefixCdnBase)).toBe(false)
  })
})

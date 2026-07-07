import { describe, expect, it } from 'vitest'

import { detectDomainKind, isUploadcareDomain } from './index'

describe('detectDomainKind', () => {
  it('detects the legacy domain', () => {
    expect(detectDomainKind('https://ucarecdn.com')).toBe('legacy')
    expect(detectDomainKind('https://ucarecdn.com/uuid/')).toBe('legacy')
  })

  it('detects prefixed ucarecd.net domains', () => {
    expect(detectDomainKind('https://1zlmtnsbgr.ucarecd.net')).toBe('prefixed')
    expect(detectDomainKind('https://demo.ucarecd.net/')).toBe('prefixed')
  })

  it('detects proxy ucr.io domains', () => {
    expect(detectDomainKind('https://pubkey.ucr.io')).toBe('proxy')
  })

  it('falls back to custom for anything else', () => {
    expect(detectDomainKind('https://cdn.example.com')).toBe('custom')
    expect(detectDomainKind('https://example.ucarecdn.com.evil.com')).toBe(
      'custom'
    )
  })

  it('throws on invalid urls', () => {
    expect(() => detectDomainKind('definitely not a url')).toThrow(TypeError)
  })
})

describe('isUploadcareDomain', () => {
  it('accepts uploadcare-operated domains', () => {
    expect(isUploadcareDomain('https://ucarecdn.com')).toBe(true)
    expect(isUploadcareDomain('https://abc123.ucarecd.net')).toBe(true)
    expect(isUploadcareDomain('https://pubkey.ucr.io')).toBe(true)
  })

  it('rejects custom and lookalike domains', () => {
    expect(isUploadcareDomain('https://cdn.example.com')).toBe(false)
    expect(isUploadcareDomain('https://notucarecdn.com')).toBe(false)
  })
})

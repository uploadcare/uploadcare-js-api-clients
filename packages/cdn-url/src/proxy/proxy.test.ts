import { describe, expect, it } from 'vitest'

import { defaultProxyEndpoint, isProxyEndpoint, proxyUrl } from './index'

describe('defaultProxyEndpoint', () => {
  it('builds the pubkey-based ucr.io endpoint', () => {
    expect(defaultProxyEndpoint('demopublickey')).toBe(
      'https://demopublickey.ucr.io'
    )
  })
})

describe('isProxyEndpoint', () => {
  it('recognizes ucr.io endpoints', () => {
    expect(isProxyEndpoint('https://demopublickey.ucr.io')).toBe(true)
    expect(isProxyEndpoint('https://proxy.example.com')).toBe(false)
  })
})

describe('proxyUrl', () => {
  it('embeds the source url after the endpoint', () => {
    expect(
      proxyUrl('https://demopublickey.ucr.io', 'https://example.com/image.jpg')
    ).toBe('https://demopublickey.ucr.io/https://example.com/image.jpg')
  })

  it('keeps the source query string intact', () => {
    expect(
      proxyUrl(
        'https://demopublickey.ucr.io',
        'https://example.com/image.jpg?v=2&w=10'
      )
    ).toBe(
      'https://demopublickey.ucr.io/https://example.com/image.jpg?v=2&w=10'
    )
  })

  it('inserts operations between the endpoint and the source', () => {
    expect(
      proxyUrl(
        'https://demopublickey.ucr.io',
        'https://example.com/image.jpg',
        [
          { name: 'preview', params: [] },
          { name: 'resize', params: ['500x'] }
        ]
      )
    ).toBe(
      'https://demopublickey.ucr.io/-/preview/-/resize/500x/https://example.com/image.jpg'
    )
  })

  it('accepts endpoints with trailing slash', () => {
    expect(
      proxyUrl('https://demopublickey.ucr.io/', 'https://example.com/a.png')
    ).toBe('https://demopublickey.ucr.io/https://example.com/a.png')
  })
})

import { describe, expect, it } from 'vitest'

import { parseCdnUrl, serializeCdnUrl, serializeOperations } from './index'

const UUID = 'c2499162-eb07-4b93-b31e-94a89a47e858'

describe('serializeOperations', () => {
  it('serializes operations into a -/-delimited string', () => {
    expect(
      serializeOperations([
        { name: 'preview', params: ['100x100'] },
        { name: 'quality', params: ['smart'] }
      ])
    ).toBe('-/preview/100x100/-/quality/smart/')
  })

  it('returns an empty string for no operations', () => {
    expect(serializeOperations([])).toBe('')
  })

  it('serializes no-param operations', () => {
    expect(serializeOperations([{ name: 'grayscale', params: [] }])).toBe(
      '-/grayscale/'
    )
  })
})

describe('serializeCdnUrl', () => {
  it('builds a minimal file url', () => {
    expect(
      serializeCdnUrl({ origin: 'https://ucarecdn.com', uuid: UUID })
    ).toBe(`https://ucarecdn.com/${UUID}/`)
  })

  it('builds a file url with operations and filename', () => {
    expect(
      serializeCdnUrl({
        origin: 'https://ucarecdn.com',
        uuid: UUID,
        operations: [
          { name: 'preview', params: ['150x150'] },
          { name: 'enhance', params: ['25'] }
        ],
        filename: '2.jpeg'
      })
    ).toBe(`https://ucarecdn.com/${UUID}/-/preview/150x150/-/enhance/25/2.jpeg`)
  })

  it('normalizes trailing slash in origin', () => {
    expect(
      serializeCdnUrl({ origin: 'https://ucarecdn.com/', uuid: UUID })
    ).toBe(`https://ucarecdn.com/${UUID}/`)
  })

  it('builds group urls', () => {
    expect(
      serializeCdnUrl({
        origin: 'https://ucarecdn.com',
        group: { uuid: UUID, count: 11 }
      })
    ).toBe(`https://ucarecdn.com/${UUID}~11/`)
  })

  it('builds group element urls with operations', () => {
    expect(
      serializeCdnUrl({
        origin: 'https://ucarecdn.com',
        group: { uuid: UUID, count: 3 },
        nth: 1,
        operations: [{ name: 'resize', params: ['256x'] }]
      })
    ).toBe(`https://ucarecdn.com/${UUID}~3/nth/1/-/resize/256x/`)
  })

  it('builds conversion urls without -/ after the uuid', () => {
    expect(
      serializeCdnUrl({
        origin: 'https://ucarecdn.com',
        uuid: UUID,
        conversion: 'video',
        operations: [{ name: 'size', params: ['720x540'] }]
      })
    ).toBe(`https://ucarecdn.com/${UUID}/video/-/size/720x540/`)
  })

  it('builds proxy urls with embedded source', () => {
    expect(
      serializeCdnUrl({
        origin: 'https://pubkey.ucr.io',
        sourceUrl: 'https://example.com/image.jpg?q=1',
        operations: [{ name: 'resize', params: ['500x'] }]
      })
    ).toBe(
      'https://pubkey.ucr.io/-/resize/500x/https://example.com/image.jpg?q=1'
    )
  })

  it('appends preserved query and hash', () => {
    expect(
      serializeCdnUrl({
        origin: 'https://cdn.example.com',
        uuid: UUID,
        operations: [{ name: 'preview', params: [] }],
        search: '?token=exp=1~hmac=x',
        hash: '#frag'
      })
    ).toBe(`https://cdn.example.com/${UUID}/-/preview/?token=exp=1~hmac=x#frag`)
  })

  it('throws when neither uuid, group nor sourceUrl is given', () => {
    // @ts-expect-error the input union requires an addressing field
    expect(() => serializeCdnUrl({ origin: 'https://ucarecdn.com' })).toThrow(
      TypeError
    )
  })

  describe('round-trips', () => {
    const urls = [
      `https://ucarecdn.com/${UUID}/`,
      `https://ucarecdn.com/${UUID}/-/preview/150x150/-/enhance/25/-/sharp/2.jpeg`,
      `https://1zlmtnsbgr.ucarecd.net/${UUID}/-/scale_crop/36x36/center/`,
      `https://ucarecdn.com/${UUID}~3/nth/2/-/preview/150x150/`,
      `https://ucarecdn.com/${UUID}/gif2video/-/size/1200x/-/format/webm/`,
      `https://ucarecdn.com/${UUID}/video/-/size/720x540/-/thumbs~20/3/`,
      'https://pubkey.ucr.io/-/preview/-/resize/500x/https://example.com/image.jpg',
      `https://cdn.example.com/${UUID}/-/scale_crop/36x36/center/?token=exp=1728524457~hmac=b79f`
    ]

    for (const url of urls) {
      it(`round-trips ${url}`, () => {
        expect(serializeCdnUrl(parseCdnUrl(url))).toBe(url)
      })
    }
  })
})

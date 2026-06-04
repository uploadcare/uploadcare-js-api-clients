import { describe, expect, it } from 'vitest'

import { cdn } from './index'

const UUID = 'c2499162-eb07-4b93-b31e-94a89a47e858'
const ORIGIN = 'https://ucarecdn.com'

describe('cdn.file', () => {
  it('builds a bare file url with the default origin', () => {
    expect(cdn.file(UUID).href).toBe(`${ORIGIN}/${UUID}/`)
  })

  it('chains image operations in order', () => {
    expect(cdn.file(UUID).preview(800, 600).quality('smart').href).toBe(
      `${ORIGIN}/${UUID}/-/preview/800x600/-/quality/smart/`
    )
  })

  it('supports the whole image op surface (spot checks)', () => {
    expect(
      cdn.file(UUID).scaleCrop(96, 96, { type: 'smart' }).borderRadius('50p')
        .href
    ).toBe(`${ORIGIN}/${UUID}/-/scale_crop/96x96/smart/-/border_radius/50p/`)
    expect(cdn.file(UUID).blur(20).grayscale().flip().href).toBe(
      `${ORIGIN}/${UUID}/-/blur/20/-/grayscale/-/flip/`
    )
    expect(cdn.file(UUID).overlay('self', { size: ['50p', '50p'] }).href).toBe(
      `${ORIGIN}/${UUID}/-/overlay/self/50px50p/`
    )
  })

  it('is immutable — chains fork', () => {
    const base = cdn.file(UUID).preview(800, 600)
    const a = base.quality('smart')
    const b = base.quality('best')
    expect(a.href).not.toBe(b.href)
    expect(base.href).toBe(`${ORIGIN}/${UUID}/-/preview/800x600/`)
  })

  it('on() rebases the origin', () => {
    expect(cdn.file(UUID).preview().on('https://cdn.example.com').href).toBe(
      `https://cdn.example.com/${UUID}/-/preview/`
    )
  })

  it('filename() appends a trailing filename', () => {
    expect(cdn.file(UUID).preview().filename('photo.jpg').href).toBe(
      `${ORIGIN}/${UUID}/-/preview/photo.jpg`
    )
  })

  it('op() is the raw escape hatch, withoutOp() removes by name', () => {
    expect(cdn.file(UUID).op('@clib', 'lib', '1.0').href).toBe(
      `${ORIGIN}/${UUID}/-/@clib/lib/1.0/`
    )
    expect(
      cdn.file(UUID).preview(800, 600).quality('smart').withoutOp('preview')
        .href
    ).toBe(`${ORIGIN}/${UUID}/-/quality/smart/`)
  })

  it('toString() and String() coercion match href', () => {
    const chain = cdn.file(UUID).preview()
    expect(String(chain)).toBe(chain.href)
  })
})

describe('cdn.configure', () => {
  it('binds a default origin for all starters', () => {
    const custom = cdn.configure({ origin: 'https://cdn.example.com' })
    expect(custom.file(UUID).href).toBe(`https://cdn.example.com/${UUID}/`)
    expect(custom.group(`${UUID}~3`).href).toBe(
      `https://cdn.example.com/${UUID}~3/`
    )
  })

  it('on() still overrides per chain', () => {
    const custom = cdn.configure({ origin: 'https://cdn.example.com' })
    expect(custom.file(UUID).on(ORIGIN).href).toBe(`${ORIGIN}/${UUID}/`)
  })
})

describe('cdn.parse', () => {
  it('returns a file chain for file urls, ready to extend', () => {
    const chain = cdn.parse(`${ORIGIN}/${UUID}/-/crop/640x480/photo.jpg`)
    expect(chain.kind).toBe('file')
    if (chain.kind !== 'file') throw new Error('expected file chain')
    expect(chain.preview(400, 400).href).toBe(
      `${ORIGIN}/${UUID}/-/crop/640x480/-/preview/400x400/photo.jpg`
    )
  })

  it('returns a group chain for group root urls', () => {
    const chain = cdn.parse(`${ORIGIN}/${UUID}~3/`)
    expect(chain.kind).toBe('group')
    if (chain.kind !== 'group') throw new Error('expected group chain')
    expect(chain.nth(1).resize({ width: 256 }).href).toBe(
      `${ORIGIN}/${UUID}~3/nth/1/-/resize/256x/`
    )
  })

  it('returns a proxy chain for proxified urls', () => {
    const chain = cdn.parse(
      `https://pubkey.ucr.io/-/preview/https://example.com/a.jpg`
    )
    expect(chain.kind).toBe('proxy')
    if (chain.kind !== 'proxy') throw new Error('expected proxy chain')
    expect(chain.resize({ width: 500 }).href).toBe(
      'https://pubkey.ucr.io/-/preview/-/resize/500x/https://example.com/a.jpg'
    )
  })

  it('preserves query and hash through edits', () => {
    const chain = cdn.parse(`${ORIGIN}/${UUID}/-/preview/?token=exp=1~hmac=x`)
    if (chain.kind !== 'file') throw new Error('expected file chain')
    expect(chain.quality('smart').href).toBe(
      `${ORIGIN}/${UUID}/-/preview/-/quality/smart/?token=exp=1~hmac=x`
    )
  })
})

describe('cdn.group', () => {
  it('accepts a group id string or object', () => {
    expect(cdn.group(`${UUID}~3`).href).toBe(`${ORIGIN}/${UUID}~3/`)
    expect(cdn.group({ uuid: UUID, count: 3 }).href).toBe(
      `${ORIGIN}/${UUID}~3/`
    )
  })

  it('nth() yields an image-capable element chain', () => {
    expect(
      cdn.group(`${UUID}~3`).nth(0).preview(300, 300).quality('smart').href
    ).toBe(`${ORIGIN}/${UUID}~3/nth/0/-/preview/300x300/-/quality/smart/`)
  })

  it('archive() builds archive urls', () => {
    expect(cdn.group(`${UUID}~3`).archive('zip', 'all.zip')).toBe(
      `${ORIGIN}/${UUID}~3/archive/zip/all.zip`
    )
  })

  it('group roots expose no image operations (type-level)', () => {
    const root = cdn.group(`${UUID}~3`)
    // @ts-expect-error image ops live on elements, not group roots
    void root.preview
  })
})

describe('cdn.proxy', () => {
  it('builds proxified urls with chained ops', () => {
    expect(
      cdn
        .proxy('https://pubkey.ucr.io', 'https://example.com/img.jpg')
        .preview()
        .resize({ width: 500 }).href
    ).toBe(
      'https://pubkey.ucr.io/-/preview/-/resize/500x/https://example.com/img.jpg'
    )
  })
})

describe('cdn.video', () => {
  it('chains video ops into a REST path', () => {
    expect(
      cdn.video(UUID).size({ width: 720, height: 540 }).format('webm').thumbs(5)
        .path
    ).toBe(`/${UUID}/video/-/size/720x540/-/format/webm/-/thumbs~5/`)
  })

  it('exposes only video operations (type-level)', () => {
    const chain = cdn.video(UUID)
    // @ts-expect-error preview is an image op, not a video op
    void chain.preview
  })
})

describe('cdn.document', () => {
  it('chains document ops into a REST path', () => {
    expect(cdn.document(UUID).format('jpg').page(2).path).toBe(
      `/${UUID}/document/-/format/jpg/-/page/2/`
    )
  })
})

describe('cdn.gif2video', () => {
  it('chains gif2video ops into a CDN url', () => {
    expect(cdn.gif2video(UUID).format('webm').quality('better').href).toBe(
      `${ORIGIN}/${UUID}/gif2video/-/format/webm/-/quality/better/`
    )
  })

  it('respects configure() origin', () => {
    const custom = cdn.configure({ origin: 'https://cdn.example.com' })
    expect(custom.gif2video(UUID).format('mp4').href).toBe(
      `https://cdn.example.com/${UUID}/gif2video/-/format/mp4/`
    )
  })
})

describe('validation passthrough', () => {
  it('creator validation still applies in chains (dev bundle)', () => {
    // @ts-expect-error invalid quality value
    expect(() => cdn.file(UUID).quality('ultra')).toThrow(RangeError)
    expect(() => cdn.video(UUID).size({ width: 721 })).toThrow(RangeError)
  })
})

describe('review regressions', () => {
  it('group element chains can set a filename', () => {
    expect(
      cdn.group(`${UUID}~3`).nth(0).preview(300, 300).filename('a.jpg').href
    ).toBe(`${ORIGIN}/${UUID}~3/nth/0/-/preview/300x300/a.jpg`)
  })

  it('proxy chains can rebase onto another endpoint', () => {
    expect(
      cdn
        .proxy('https://a.ucr.io', 'https://example.com/x.jpg')
        .preview()
        .on('https://b.ucr.io/').href
    ).toBe('https://b.ucr.io/-/preview/https://example.com/x.jpg')
  })

  it('defaultProxyEndpoint is available from the fluent entry', async () => {
    const { defaultProxyEndpoint } = await import('./index')
    expect(
      cdn.proxy(defaultProxyEndpoint('pubkey'), 'https://example.com/x.jpg')
        .href
    ).toBe('https://pubkey.ucr.io/https://example.com/x.jpg')
  })

  it('conversion chains stay kind-restricted (type-level)', () => {
    // @ts-expect-error quality of images does not exist on DocumentChain
    void cdn.document(UUID).quality
    // @ts-expect-error resize is not a gif2video operation
    void cdn.gif2video(UUID).resize
  })

  it('nth() still validates eagerly in dev', () => {
    expect(() => cdn.group(`${UUID}~3`).nth(3)).toThrow(RangeError)
  })
})

describe('fluent operation references', () => {
  it('withoutOp() accepts creators', async () => {
    const { preview, quality } = await import('../ops/index')
    expect(
      cdn.file(UUID).preview(800, 600).quality('smart').withoutOp(preview).href
    ).toBe(`${ORIGIN}/${UUID}/-/quality/smart/`)
    expect(cdn.file(UUID).quality('smart').withoutOp(quality).href).toBe(
      `${ORIGIN}/${UUID}/`
    )
  })

  it('withoutOp(thumbs) removes thumbs~N video ops', async () => {
    const { thumbs } = await import('../video/index')
    expect(
      cdn.video(UUID).size({ width: 720 }).thumbs(5).withoutOp(thumbs).path
    ).toBe(`/${UUID}/video/-/size/720x/`)
  })
})

import { describe, expect, it } from 'vitest'

import {
  base,
  LEGACY_CDN_BASE,
  parse,
  PREFIX_CDN_BASE,
  prefixedCdnBase
} from './index'

const UUID = 'c2499162-eb07-4b93-b31e-94a89a47e858'
const PUBLIC_KEY = 'demopublickey'
// sha256(PUBLIC_KEY) as a bigint, base36, first 10 chars — computed with
// node:crypto, independently of @uploadcare/cname-prefix, so this pins the real
// prefix and not whatever that package happens to return.
const PREFIX = '1s4oyld5dc'
const CDN_BASE = `https://${PREFIX}.ucarecd.net`

const cdn = base(prefixedCdnBase(PUBLIC_KEY))

// Never invoked — it exists for the type checker only.
const typeProbe = () => {
  // @ts-expect-error a base is required; there is no working default
  void base()
}

describe('cdn.file', () => {
  it('builds a bare file url on the configured cdnBase', () => {
    expect(cdn.file(UUID).href).toBe(`${CDN_BASE}/${UUID}/`)
  })

  it('chains image operations in order', () => {
    expect(cdn.file(UUID).preview(800, 600).quality('smart').href).toBe(
      `${CDN_BASE}/${UUID}/-/preview/800x600/-/quality/smart/`
    )
  })

  it('supports the whole image op surface (spot checks)', () => {
    expect(
      cdn.file(UUID).scaleCrop(96, 96, { type: 'smart' }).borderRadius('50p')
        .href
    ).toBe(`${CDN_BASE}/${UUID}/-/scale_crop/96x96/smart/-/border_radius/50p/`)
    expect(cdn.file(UUID).blur(20).grayscale().flip().href).toBe(
      `${CDN_BASE}/${UUID}/-/blur/20/-/grayscale/-/flip/`
    )
    expect(cdn.file(UUID).overlay('self', { size: ['50p', '50p'] }).href).toBe(
      `${CDN_BASE}/${UUID}/-/overlay/self/50px50p/`
    )
  })

  it('is immutable — chains fork', () => {
    const previewed = cdn.file(UUID).preview(800, 600)
    const a = previewed.quality('smart')
    const b = previewed.quality('best')
    expect(a.href).not.toBe(b.href)
    expect(previewed.href).toBe(`${CDN_BASE}/${UUID}/-/preview/800x600/`)
  })

  it('on() rebases the cdnBase', () => {
    expect(cdn.file(UUID).preview().on('https://cdn.example.com').href).toBe(
      `https://cdn.example.com/${UUID}/-/preview/`
    )
  })

  it('filename() appends a trailing filename', () => {
    expect(cdn.file(UUID).preview().filename('photo.jpg').href).toBe(
      `${CDN_BASE}/${UUID}/-/preview/photo.jpg`
    )
  })

  it('op() is the raw escape hatch, withoutOp() removes by name', () => {
    expect(cdn.file(UUID).op('@clib', 'lib', '1.0').href).toBe(
      `${CDN_BASE}/${UUID}/-/@clib/lib/1.0/`
    )
    expect(
      cdn.file(UUID).preview(800, 600).quality('smart').withoutOp('preview')
        .href
    ).toBe(`${CDN_BASE}/${UUID}/-/quality/smart/`)
  })

  it('toString() and String() coercion match href', () => {
    const chain = cdn.file(UUID).preview()
    expect(String(chain)).toBe(chain.href)
  })
})

describe('prefixedCdnBase', () => {
  it('is the cname-prefix helper under a shorter name', () => {
    expect(prefixedCdnBase(PUBLIC_KEY)).toBe(CDN_BASE)
    expect(PREFIX_CDN_BASE).toBe('https://ucarecd.net')
  })

  it('feeds base(), which binds it for every starter', () => {
    expect(cdn.file(UUID).href).toBe(`${CDN_BASE}/${UUID}/`)
    expect(cdn.group(`${UUID}~3`).href).toBe(`${CDN_BASE}/${UUID}~3/`)
    expect(cdn.gif2video(UUID).format('webm').href).toBe(
      `${CDN_BASE}/${UUID}/gif2video/-/format/webm/`
    )
  })

  it('nothing prefixes on your behalf — a bare zone stays bare', () => {
    expect(base(PREFIX_CDN_BASE).file(UUID).href).toBe(
      `https://ucarecd.net/${UUID}/`
    )
    // …which is why there is no default: the only fallback a JS caller can trip
    // into is the legacy shared base, which does serve unprefixed.
    expect(LEGACY_CDN_BASE).toBe('https://ucarecdn.com')
  })
})

describe('base(cdnBase)', () => {
  it('uses the given base as it stands', () => {
    const custom = base('https://cdn.example.com')
    expect(custom.file(UUID).href).toBe(`https://cdn.example.com/${UUID}/`)
    expect(custom.group(`${UUID}~3`).href).toBe(
      `https://cdn.example.com/${UUID}~3/`
    )
  })

  it('on() still overrides per chain', () => {
    const custom = base('https://cdn.example.com')
    expect(custom.file(UUID).on(CDN_BASE).href).toBe(`${CDN_BASE}/${UUID}/`)
  })

  it('cdn.base() rebases the whole entry object', () => {
    expect(cdn.base('https://cdn.example.com').file(UUID).href).toBe(
      `https://cdn.example.com/${UUID}/`
    )
    expect(cdn.base).toBe(base)
  })

  it('refuses to guess a base', () => {
    expect(typeProbe).toBeTypeOf('function')
    // @ts-expect-error probing the runtime guard a JS caller would hit
    expect(() => base()).toThrow(TypeError)
    expect(() => base('')).toThrow(TypeError)
  })
})

describe('the fluent entry object is frozen', () => {
  it('rejects reassigning a starter', () => {
    expect(Object.isFrozen(cdn)).toBe(true)
    expect(Object.isFrozen(base(LEGACY_CDN_BASE))).toBe(true)
    expect(() => {
      // @ts-expect-error the surface is readonly at the type level too
      cdn.file = () => cdn.file(UUID)
    }).toThrow(TypeError)
  })
})

describe('cdn.parse', () => {
  it('is also importable standalone — a stored url carries its own cdnBase', () => {
    const legacy = parse(`${LEGACY_CDN_BASE}/${UUID}/-/preview/`)
    expect(legacy.kind).toBe('file')
    expect(legacy.href).toBe(`${LEGACY_CDN_BASE}/${UUID}/-/preview/`)
    expect(cdn.parse).toBe(parse)
  })

  it('returns a file chain for file urls, ready to extend', () => {
    const chain = cdn.parse(`${CDN_BASE}/${UUID}/-/crop/640x480/photo.jpg`)
    expect(chain.kind).toBe('file')
    if (chain.kind !== 'file') throw new Error('expected file chain')
    expect(chain.preview(400, 400).href).toBe(
      `${CDN_BASE}/${UUID}/-/crop/640x480/-/preview/400x400/photo.jpg`
    )
  })

  it('returns a group chain for group root urls', () => {
    const chain = cdn.parse(`${CDN_BASE}/${UUID}~3/`)
    expect(chain.kind).toBe('group')
    if (chain.kind !== 'group') throw new Error('expected group chain')
    expect(chain.nth(1).resize({ width: 256 }).href).toBe(
      `${CDN_BASE}/${UUID}~3/nth/1/-/resize/256x/`
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
    const chain = cdn.parse(`${CDN_BASE}/${UUID}/-/preview/?token=exp=1~hmac=x`)
    if (chain.kind !== 'file') throw new Error('expected file chain')
    expect(chain.quality('smart').href).toBe(
      `${CDN_BASE}/${UUID}/-/preview/-/quality/smart/?token=exp=1~hmac=x`
    )
  })
})

describe('cdn.group', () => {
  it('accepts a group id string or object', () => {
    expect(cdn.group(`${UUID}~3`).href).toBe(`${CDN_BASE}/${UUID}~3/`)
    expect(cdn.group({ uuid: UUID, count: 3 }).href).toBe(
      `${CDN_BASE}/${UUID}~3/`
    )
  })

  it('nth() yields an image-capable element chain', () => {
    expect(
      cdn.group(`${UUID}~3`).nth(0).preview(300, 300).quality('smart').href
    ).toBe(`${CDN_BASE}/${UUID}~3/nth/0/-/preview/300x300/-/quality/smart/`)
  })

  it('archive() builds archive urls', () => {
    expect(cdn.group(`${UUID}~3`).archive('zip', 'all.zip')).toBe(
      `${CDN_BASE}/${UUID}~3/archive/zip/all.zip`
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
      `${CDN_BASE}/${UUID}/gif2video/-/format/webm/-/quality/better/`
    )
  })

  it('respects the configured cdn base', () => {
    const custom = cdn.base('https://cdn.example.com')
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
    ).toBe(`${CDN_BASE}/${UUID}~3/nth/0/-/preview/300x300/a.jpg`)
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
    ).toBe(`${CDN_BASE}/${UUID}/-/quality/smart/`)
    expect(cdn.file(UUID).quality('smart').withoutOp(quality).href).toBe(
      `${CDN_BASE}/${UUID}/`
    )
  })

  it('withoutOp(thumbs) removes thumbs~N video ops', async () => {
    const { thumbs } = await import('../video/index')
    expect(
      cdn.video(UUID).size({ width: 720 }).thumbs(5).withoutOp(thumbs).path
    ).toBe(`/${UUID}/video/-/size/720x/`)
  })

  describe('chain inspection', () => {
    it('hasOp() and getOp() mirror the builder', async () => {
      const { preview, quality } = await import('../ops/index')
      const chain = cdn.file(UUID).preview(800, 600).quality('smart')
      expect(chain.hasOp(quality)).toBe(true)
      expect(chain.hasOp('blur')).toBe(false)
      expect(chain.getOp(quality)).toEqual({
        name: 'quality',
        params: ['smart']
      })
      expect(chain.getOp(preview)).toEqual({
        name: 'preview',
        params: ['800x600']
      })
      expect(chain.getOp('blur')).toBeNull()
    })

    it('getAllOps() collects every match', () => {
      const chain = cdn
        .file(UUID)
        .op('overlay', UUID, '50p,50p')
        .preview(800, 600)
        .op('overlay', UUID, '10p,10p')
      expect(chain.getAllOps('overlay')).toEqual([
        { name: 'overlay', params: [UUID, '50p,50p'] },
        { name: 'overlay', params: [UUID, '10p,10p'] }
      ])
      expect(chain.getAllOps('blur')).toEqual([])
    })

    it('replaceOp() swaps in place, appending when absent', async () => {
      const { quality, resize } = await import('../ops/index')
      const chain = cdn.file(UUID).resize({ width: 300 }).quality('smart')
      expect(chain.replaceOp(resize({ width: 500 })).href).toBe(
        `${CDN_BASE}/${UUID}/-/resize/500x/-/quality/smart/`
      )
      expect(cdn.file(UUID).replaceOp(quality('best')).href).toBe(
        `${CDN_BASE}/${UUID}/-/quality/best/`
      )
    })

    it('replaceOp() handles counted video ops', async () => {
      const { thumbs } = await import('../video/index')
      expect(
        cdn.video(UUID).size({ width: 720 }).thumbs(5).replaceOp(thumbs(3)).path
      ).toBe(`/${UUID}/video/-/size/720x/-/thumbs~3/`)
    })

    it('replaceAllOps() collapses duplicates into one', () => {
      const chain = cdn
        .file(UUID)
        .op('overlay', UUID, '50p,50p')
        .preview(800, 600)
        .op('overlay', UUID, '10p,10p')
      expect(
        chain.replaceAllOps({ name: 'overlay', params: [UUID] }).operations
      ).toEqual([
        { name: 'overlay', params: [UUID] },
        { name: 'preview', params: ['800x600'] }
      ])
    })

    it('updateOperations() replaces the nth match, keeping position', () => {
      const chain = cdn
        .file(UUID)
        .op('overlay', UUID, '50p,50p')
        .preview(800, 600)
        .op('overlay', UUID, '10p,10p')
      let seen = -1
      expect(
        chain
          .updateOperations((ops) =>
            ops.map((op) =>
              op.name === 'overlay' && ++seen === 1
                ? { name: 'overlay', params: [UUID, '1p,1p'] }
                : op
            )
          )
          .operations.map((op) => op.params[1])
      ).toEqual(['50p,50p', undefined, '1p,1p'])
    })

    it('updateOperations() gives conversion chains an edit path', async () => {
      const { size } = await import('../video/index')
      expect(
        cdn
          .video(UUID)
          .size({ width: 720 })
          .thumbs(5)
          .updateOperations((ops) =>
            ops.map((op) => (op.name === 'size' ? size({ width: 480 }) : op))
          ).path
      ).toBe(`/${UUID}/video/-/size/480x/-/thumbs~5/`)
    })

    it('updateOperations() preserves the chain subtype', () => {
      const video = cdn.video(UUID).size({ width: 720 })
      expect(video.updateOperations((ops) => ops)).toBeInstanceOf(
        video.constructor
      )
      const file = cdn.file(UUID).preview(800, 600)
      expect(file.updateOperations((ops) => ops).href).toBe(file.href)
    })

    it('updateOperations() rejects a callback that returns no array', () => {
      expect(() =>
        // @ts-expect-error deliberately wrong callback shape
        cdn
          .file(UUID)
          .preview(800, 600)
          .updateOperations(() => undefined)
      ).toThrow(TypeError)
    })

    it('updateOperations() rejects a callback that returns no array', () => {
      expect(() =>
        // @ts-expect-error deliberately wrong callback shape
        cdn
          .file(UUID)
          .preview(800, 600)
          .updateOperations(() => undefined)
      ).toThrow(TypeError)
    })

    it('updateOperations() hands the callback a defensive copy', () => {
      const chain = cdn.file(UUID).preview(800, 600)
      chain.updateOperations((ops) => {
        ops.push({ name: 'quality', params: ['smart'] })
        return ops
      })
      expect(chain.href).toBe(`${CDN_BASE}/${UUID}/-/preview/800x600/`)
    })

    it('inspection does not mutate the chain', () => {
      const chain = cdn.file(UUID).preview(800, 600)
      chain.getAllOps('preview').length = 0
      chain.replaceAllOps({ name: 'preview', params: ['1x1'] })
      expect(chain.href).toBe(`${CDN_BASE}/${UUID}/-/preview/800x600/`)
    })
  })
})

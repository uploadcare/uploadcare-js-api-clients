import { describe, expect, it } from 'vitest'

import { cdn, LEGACY_CDN_BASE, parse, PREFIX_CDN_BASE } from './index'
import { prefixedCdnBase } from '../cdn-base/index'

const UUID = 'c2499162-eb07-4b93-b31e-94a89a47e858'
const PUBLIC_KEY = 'demopublickey'
// sha256(PUBLIC_KEY) as a bigint, base36, first 10 chars — computed with
// node:crypto, independently of @uploadcare/cname-prefix, so this pins the real
// prefix and not whatever that package happens to return.
const PREFIX = '1s4oyld5dc'
const CDN_BASE = `https://${PREFIX}.ucarecd.net`

const myCdn = cdn.base(prefixedCdnBase(PUBLIC_KEY))

// Never invoked — it exists for the type checker only.
const typeProbe = () => {
  // @ts-expect-error a base is required; there is no working default
  void cdn.base()
}

describe('cdn.file', () => {
  it('builds a bare file url on the configured cdnBase', () => {
    expect(myCdn.file(UUID).href).toBe(`${CDN_BASE}/${UUID}/`)
  })

  it('chains image operations in order', () => {
    expect(myCdn.file(UUID).preview(800, 600).quality('smart').href).toBe(
      `${CDN_BASE}/${UUID}/-/preview/800x600/-/quality/smart/`
    )
  })

  it('supports the whole image op surface (spot checks)', () => {
    expect(
      myCdn.file(UUID).scaleCrop(96, 96, { type: 'smart' }).borderRadius('50p')
        .href
    ).toBe(`${CDN_BASE}/${UUID}/-/scale_crop/96x96/smart/-/border_radius/50p/`)
    expect(myCdn.file(UUID).blur(20).grayscale().flip().href).toBe(
      `${CDN_BASE}/${UUID}/-/blur/20/-/grayscale/-/flip/`
    )
    expect(
      myCdn.file(UUID).overlay('self', { size: ['50p', '50p'] }).href
    ).toBe(`${CDN_BASE}/${UUID}/-/overlay/self/50px50p/`)
  })

  it('is immutable — chains fork', () => {
    const previewed = myCdn.file(UUID).preview(800, 600)
    const a = previewed.quality('smart')
    const b = previewed.quality('best')
    expect(a.href).not.toBe(b.href)
    expect(previewed.href).toBe(`${CDN_BASE}/${UUID}/-/preview/800x600/`)
  })

  it('on() rebases the cdnBase', () => {
    expect(
      myCdn.file(UUID).preview().base('https://cdn.example.com').href
    ).toBe(`https://cdn.example.com/${UUID}/-/preview/`)
  })

  it('filename() appends a trailing filename', () => {
    expect(myCdn.file(UUID).preview().filename('photo.jpg').href).toBe(
      `${CDN_BASE}/${UUID}/-/preview/photo.jpg`
    )
  })

  it('op() is the raw escape hatch, withoutOp() removes by name', () => {
    expect(myCdn.file(UUID).op('@clib', 'lib', '1.0').href).toBe(
      `${CDN_BASE}/${UUID}/-/@clib/lib/1.0/`
    )
    expect(
      myCdn.file(UUID).preview(800, 600).quality('smart').withoutOp('preview')
        .href
    ).toBe(`${CDN_BASE}/${UUID}/-/quality/smart/`)
  })

  it('toString() and String() coercion match href', () => {
    const chain = myCdn.file(UUID).preview()
    expect(String(chain)).toBe(chain.href)
  })
})

describe('prefixedCdnBase', () => {
  it('is the cname-prefix helper under a shorter name', () => {
    expect(prefixedCdnBase(PUBLIC_KEY)).toBe(CDN_BASE)
    expect(PREFIX_CDN_BASE).toBe('https://ucarecd.net')
  })

  it('feeds base(), which binds it for every starter', () => {
    expect(myCdn.file(UUID).href).toBe(`${CDN_BASE}/${UUID}/`)
    expect(myCdn.group(`${UUID}~3`).href).toBe(`${CDN_BASE}/${UUID}~3/`)
    expect(myCdn.gif2video(UUID).format('webm').href).toBe(
      `${CDN_BASE}/${UUID}/gif2video/-/format/webm/`
    )
  })

  it('nothing prefixes on your behalf — a bare zone stays bare', () => {
    expect(cdn.base(PREFIX_CDN_BASE).file(UUID).href).toBe(
      `https://ucarecd.net/${UUID}/`
    )
    // …which is why there is no default: the only fallback a JS caller can trip
    // into is the legacy shared base, which does serve unprefixed.
    expect(LEGACY_CDN_BASE).toBe('https://ucarecdn.com')
  })
})

describe('cdn.base(cdnBase)', () => {
  it('uses the given base as it stands', () => {
    const custom = cdn.base('https://cdn.example.com')
    expect(custom.file(UUID).href).toBe(`https://cdn.example.com/${UUID}/`)
    expect(custom.group(`${UUID}~3`).href).toBe(
      `https://cdn.example.com/${UUID}~3/`
    )
  })

  it('base() still overrides per chain', () => {
    const custom = cdn.base('https://cdn.example.com')
    expect(custom.file(UUID).base(CDN_BASE).href).toBe(`${CDN_BASE}/${UUID}/`)
  })

  it('rebinds without touching the receiver', () => {
    const other = myCdn.base('https://cdn.example.com')
    expect(other.file(UUID).href).toBe(`https://cdn.example.com/${UUID}/`)
    expect(myCdn.file(UUID).href).toBe(`${CDN_BASE}/${UUID}/`)
  })

  it('refuses the base-requiring starters until a base is bound', () => {
    for (const starter of ['file', 'group', 'gif2video'] as const) {
      // @ts-expect-error absent from UnboundCdn — this is the compile-time half
      expect(() => cdn[starter]('anything')).toThrow(TypeError)
      // @ts-expect-error same
      expect(() => cdn[starter]('anything')).toThrow(/cdn\.base\(/)
    }
  })

  it('offers the base-free starters straight away', () => {
    expect(cdn.video(UUID).thumbs(5).path).toBe(`/${UUID}/video/-/thumbs~5/`)
    expect(cdn.document(UUID).path).toBe(`/${UUID}/document/`)
    expect(cdn.parse(`${CDN_BASE}/${UUID}/`).kind).toBe('file')
    expect(
      cdn.proxy('https://pk.ucr.io', 'https://example.com/a.jpg').preview().href
    ).toBe('https://pk.ucr.io/-/preview/https://example.com/a.jpg')
  })

  it('refuses to guess a base', () => {
    expect(typeProbe).toBeTypeOf('function')
    // @ts-expect-error probing the runtime guard a JS caller would hit
    expect(() => cdn.base()).toThrow(TypeError)
    expect(() => cdn.base('')).toThrow(TypeError)
  })

  it('has no default host to fall back to, in either flavor', () => {
    // The guard is deliberately outside `if (__DEV__)`; `scripts/smoke-node.mjs`
    // asserts the same thing against the built production bundle, where this
    // suite cannot reach. This pins the intent so nobody "optimizes" the check
    // back behind a dev flag.
    expect(() => cdn.base('')).toThrow(/CDN base is required/)
    expect(LEGACY_CDN_BASE).toBe('https://ucarecdn.com') // opt in explicitly
    expect(cdn.base(LEGACY_CDN_BASE).file(UUID).href).toBe(
      `${LEGACY_CDN_BASE}/${UUID}/`
    )
  })
})

describe('updateOperations: one contract, both facades', () => {
  it('a callback that returns nothing throws in dev and no-ops in prod', () => {
    const chain = myCdn.file(UUID).preview(800, 600)
    // vitest defines __DEV__ = true, so this is the dev half; the prod half —
    // "leaves the chain unchanged" — is asserted against the built bundle by
    // scripts/smoke-node.mjs.
    // a block-bodied callback with no `return` — the mistake the guard exists for
    expect(() =>
      // @ts-expect-error the callback must return an array; this one returns void
      chain.updateOperations(() => {})
    ).toThrow(/must return an operations array/)
  })

  it('a valid callback rewrites the chain', () => {
    expect(
      myCdn
        .file(UUID)
        .preview(800, 600)
        .updateOperations((ops) => [...ops, { name: 'blur', params: ['10'] }])
        .href
    ).toBe(`${CDN_BASE}/${UUID}/-/preview/800x600/-/blur/10/`)
  })
})

describe('the fluent entry object is frozen', () => {
  it('rejects reassigning a starter', () => {
    expect(Object.isFrozen(cdn)).toBe(true)
    expect(Object.isFrozen(cdn.base(LEGACY_CDN_BASE))).toBe(true)
    expect(() => {
      // @ts-expect-error the surface is readonly at the type level too
      cdn.file = () => myCdn.file(UUID)
    }).toThrow(TypeError)
  })
})

describe('cdn.parse', () => {
  it('round-trips every kind, conversion prefixes included', () => {
    // Regression: `wrapParsed` used to copy the parsed url field by field and
    // omitted `conversion`, so a parsed gif2video url serialized back pointing
    // at the original image. The chains now hold the parsed url itself.
    for (const url of [
      `${CDN_BASE}/${UUID}/`,
      `${CDN_BASE}/${UUID}/-/preview/800x600/photo.jpg`,
      `${CDN_BASE}/${UUID}/gif2video/-/format/webm/`,
      `${CDN_BASE}/${UUID}/video/-/size/720x540/`,
      `${CDN_BASE}/${UUID}~3/`,
      `${CDN_BASE}/${UUID}~3/nth/1/-/resize/256x/`,
      `${CDN_BASE}/${UUID}/-/preview/?token=exp=1~acl=/x/*~hmac=deadbeef`,
      'https://pk.ucr.io/-/preview/https://example.com/a.jpg'
    ]) {
      expect(cdn.parse(url).href).toBe(url)
    }
  })

  it('keeps the conversion prefix through an edit', () => {
    const chain = cdn.parse(`${CDN_BASE}/${UUID}/gif2video/-/format/webm/`)
    if (chain.kind !== 'file') throw new Error('expected a file chain')
    expect(chain.quality('better').href).toBe(
      `${CDN_BASE}/${UUID}/gif2video/-/format/webm/-/quality/better/`
    )
  })

  it('is also importable standalone — a stored url carries its own cdnBase', () => {
    const legacy = parse(`${LEGACY_CDN_BASE}/${UUID}/-/preview/`)
    expect(legacy.kind).toBe('file')
    expect(legacy.href).toBe(`${LEGACY_CDN_BASE}/${UUID}/-/preview/`)
    expect(cdn.parse).toBe(parse)
  })

  it('returns a file chain for file urls, ready to extend', () => {
    const chain = myCdn.parse(`${CDN_BASE}/${UUID}/-/crop/640x480/photo.jpg`)
    expect(chain.kind).toBe('file')
    if (chain.kind !== 'file') throw new Error('expected file chain')
    expect(chain.preview(400, 400).href).toBe(
      `${CDN_BASE}/${UUID}/-/crop/640x480/-/preview/400x400/photo.jpg`
    )
  })

  it('returns a group chain for group root urls', () => {
    const chain = myCdn.parse(`${CDN_BASE}/${UUID}~3/`)
    expect(chain.kind).toBe('group')
    if (chain.kind !== 'group') throw new Error('expected group chain')
    expect(chain.nth(1).resize({ width: 256 }).href).toBe(
      `${CDN_BASE}/${UUID}~3/nth/1/-/resize/256x/`
    )
  })

  it('returns a proxy chain for proxified urls', () => {
    const chain = myCdn.parse(
      `https://pubkey.ucr.io/-/preview/https://example.com/a.jpg`
    )
    expect(chain.kind).toBe('proxy')
    if (chain.kind !== 'proxy') throw new Error('expected proxy chain')
    expect(chain.resize({ width: 500 }).href).toBe(
      'https://pubkey.ucr.io/-/preview/-/resize/500x/https://example.com/a.jpg'
    )
  })

  it('preserves query and hash through edits', () => {
    const chain = myCdn.parse(
      `${CDN_BASE}/${UUID}/-/preview/?token=exp=1~hmac=x`
    )
    if (chain.kind !== 'file') throw new Error('expected file chain')
    expect(chain.quality('smart').href).toBe(
      `${CDN_BASE}/${UUID}/-/preview/-/quality/smart/?token=exp=1~hmac=x`
    )
  })
})

describe('cdn.group', () => {
  it('accepts a group id string or object', () => {
    expect(myCdn.group(`${UUID}~3`).href).toBe(`${CDN_BASE}/${UUID}~3/`)
    expect(myCdn.group({ uuid: UUID, count: 3 }).href).toBe(
      `${CDN_BASE}/${UUID}~3/`
    )
  })

  it('nth() yields an image-capable element chain', () => {
    expect(
      myCdn.group(`${UUID}~3`).nth(0).preview(300, 300).quality('smart').href
    ).toBe(`${CDN_BASE}/${UUID}~3/nth/0/-/preview/300x300/-/quality/smart/`)
  })

  it('archive() builds archive urls', () => {
    expect(myCdn.group(`${UUID}~3`).archive('zip', 'all.zip')).toBe(
      `${CDN_BASE}/${UUID}~3/archive/zip/all.zip`
    )
  })

  it('group roots expose no image operations (type-level)', () => {
    const root = myCdn.group(`${UUID}~3`)
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
      myCdn
        .video(UUID)
        .size({ width: 720, height: 540 })
        .format('webm')
        .thumbs(5).path
    ).toBe(`/${UUID}/video/-/size/720x540/-/format/webm/-/thumbs~5/`)
  })

  it('exposes only video operations (type-level)', () => {
    const chain = myCdn.video(UUID)
    // @ts-expect-error preview is an image op, not a video op
    void chain.preview
  })
})

describe('cdn.document', () => {
  it('chains document ops into a REST path', () => {
    expect(myCdn.document(UUID).format('jpg').page(2).path).toBe(
      `/${UUID}/document/-/format/jpg/-/page/2/`
    )
  })
})

describe('cdn.gif2video', () => {
  it('chains gif2video ops into a CDN url', () => {
    expect(myCdn.gif2video(UUID).format('webm').quality('better').href).toBe(
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
    expect(() => myCdn.file(UUID).quality('ultra')).toThrow(RangeError)
    expect(() => myCdn.video(UUID).size({ width: 721 })).toThrow(RangeError)
  })
})

describe('review regressions', () => {
  it('group element chains can set a filename', () => {
    expect(
      myCdn.group(`${UUID}~3`).nth(0).preview(300, 300).filename('a.jpg').href
    ).toBe(`${CDN_BASE}/${UUID}~3/nth/0/-/preview/300x300/a.jpg`)
  })

  it('proxy chains can rebase onto another endpoint', () => {
    expect(
      cdn
        .proxy('https://a.ucr.io', 'https://example.com/x.jpg')
        .preview()
        .proxy('https://b.ucr.io/').href
    ).toBe('https://b.ucr.io/-/preview/https://example.com/x.jpg')
  })

  it('defaultProxyEndpoint is available from the fluent entry', async () => {
    const { defaultProxyEndpoint } = await import('./index')
    expect(
      myCdn.proxy(defaultProxyEndpoint('pubkey'), 'https://example.com/x.jpg')
        .href
    ).toBe('https://pubkey.ucr.io/https://example.com/x.jpg')
  })

  it('conversion chains stay kind-restricted (type-level)', () => {
    // @ts-expect-error quality of images does not exist on DocumentChain
    void myCdn.document(UUID).quality
    // @ts-expect-error resize is not a gif2video operation
    void myCdn.gif2video(UUID).resize
  })

  it('nth() still validates eagerly in dev', () => {
    expect(() => myCdn.group(`${UUID}~3`).nth(3)).toThrow(RangeError)
  })
})

describe('fluent operation references', () => {
  it('withoutOp() accepts creators', async () => {
    const { preview, quality } = await import('../ops/index')
    expect(
      myCdn.file(UUID).preview(800, 600).quality('smart').withoutOp(preview)
        .href
    ).toBe(`${CDN_BASE}/${UUID}/-/quality/smart/`)
    expect(myCdn.file(UUID).quality('smart').withoutOp(quality).href).toBe(
      `${CDN_BASE}/${UUID}/`
    )
  })

  it('withoutOp(thumbs) removes thumbs~N video ops', async () => {
    const { thumbs } = await import('../video/index')
    expect(
      myCdn.video(UUID).size({ width: 720 }).thumbs(5).withoutOp(thumbs).path
    ).toBe(`/${UUID}/video/-/size/720x/`)
  })

  describe('chain inspection', () => {
    it('hasOp() and getOp() mirror the builder', async () => {
      const { preview, quality } = await import('../ops/index')
      const chain = myCdn.file(UUID).preview(800, 600).quality('smart')
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
      const chain = myCdn
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
      const chain = myCdn.file(UUID).resize({ width: 300 }).quality('smart')
      expect(chain.replaceOp(resize({ width: 500 })).href).toBe(
        `${CDN_BASE}/${UUID}/-/resize/500x/-/quality/smart/`
      )
      expect(myCdn.file(UUID).replaceOp(quality('best')).href).toBe(
        `${CDN_BASE}/${UUID}/-/quality/best/`
      )
    })

    it('replaceOp() handles counted video ops', async () => {
      const { thumbs } = await import('../video/index')
      expect(
        myCdn.video(UUID).size({ width: 720 }).thumbs(5).replaceOp(thumbs(3))
          .path
      ).toBe(`/${UUID}/video/-/size/720x/-/thumbs~3/`)
    })

    it('replaceAllOps() collapses duplicates into one', () => {
      const chain = myCdn
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
      const chain = myCdn
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
      const video = myCdn.video(UUID).size({ width: 720 })
      expect(video.updateOperations((ops) => ops)).toBeInstanceOf(
        video.constructor
      )
      const file = myCdn.file(UUID).preview(800, 600)
      expect(file.updateOperations((ops) => ops).href).toBe(file.href)
    })

    it('updateOperations() rejects a callback that returns no array', () => {
      expect(() =>
        // @ts-expect-error deliberately wrong callback shape
        myCdn
          .file(UUID)
          .preview(800, 600)
          .updateOperations(() => undefined)
      ).toThrow(TypeError)
    })

    it('updateOperations() rejects a callback that returns no array', () => {
      expect(() =>
        // @ts-expect-error deliberately wrong callback shape
        myCdn
          .file(UUID)
          .preview(800, 600)
          .updateOperations(() => undefined)
      ).toThrow(TypeError)
    })

    it('updateOperations() hands the callback a defensive copy', () => {
      const chain = myCdn.file(UUID).preview(800, 600)
      chain.updateOperations((ops) => {
        ops.push({ name: 'quality', params: ['smart'] })
        return ops
      })
      expect(chain.href).toBe(`${CDN_BASE}/${UUID}/-/preview/800x600/`)
    })

    it('inspection does not mutate the chain', () => {
      const chain = myCdn.file(UUID).preview(800, 600)
      chain.getAllOps('preview').length = 0
      chain.replaceAllOps({ name: 'preview', params: ['1x1'] })
      expect(chain.href).toBe(`${CDN_BASE}/${UUID}/-/preview/800x600/`)
    })
  })
})

/**
 * Executes every snippet in `docs/how-to/cookbook.md` so the page cannot rot:
 * change the API and these fail before a reader hits a broken example. The
 * preamble below mirrors the page's own preamble block verbatim.
 */
import { describe, expect, it } from 'vitest'

import { CdnUrl } from './builder/index'
import { cdn } from './fluent/index'
import { prefixedCdnBase } from './cdn-base/index'
import {
  detectDomainKind,
  isUploadcareDomain,
  operationMatches,
  parseCdnUrl,
  serializeCdnUrl
} from './index'
import {
  blur,
  font,
  overlay,
  quality,
  resize,
  scaleCrop,
  text,
  textAlign
} from './ops/index'
import { joinModifiers, modifiers, tinyBuild, tinyParse } from './tiny/index'
import type { CdnOperation } from './types'
import { size, thumbs, videoPath } from './video/index'
import { isStackable, operationInputs } from './validate/index'

// --- the page's preamble, verbatim -----------------------------------------
const uuid = 'c2499162-eb07-4b93-b31e-94a89a47e858'
const myCdn = cdn.base(prefixedCdnBase('demopublickey'))
const cdnBase = 'https://1s4oyld5dc.ucarecd.net'
const stored = `${cdnBase}/${uuid}/-/resize/300x/-/quality/smart/`

function mapOperations(
  url: string,
  fn: (operations: CdnOperation[]) => CdnOperation[]
): string {
  const parsed = parseCdnUrl(url)
  if (!('operations' in parsed)) return url
  return serializeCdnUrl({ ...parsed, operations: fn([...parsed.operations]) })
}

describe('I want the smallest possible bundle', () => {
  it('edits the chain as a string', () => {
    const parts = tinyParse(stored)
    expect(
      tinyBuild({
        ...parts,
        modifiers: joinModifiers(parts.modifiers, modifiers('blur/10'))
      })
    ).toBe(`${cdnBase}/${uuid}/-/resize/300x/-/quality/smart/-/blur/10/`)
  })
})

describe('cookbook: getting a URL out', () => {
  it('thumbnail from a uuid', () => {
    expect(
      serializeCdnUrl({
        cdnBase: 'https://1s4oyld5dc.ucarecd.net',
        uuid,
        operations: [scaleCrop(300, 300, { type: 'smart' })]
      })
    ).toBe(`https://1s4oyld5dc.ucarecd.net/${uuid}/-/scale_crop/300x300/smart/`)
    // the absolute minimum: cdnBase + one addressing field
    expect(
      serializeCdnUrl({ cdnBase: 'https://1s4oyld5dc.ucarecd.net', uuid })
    ).toBe(`https://1s4oyld5dc.ucarecd.net/${uuid}/`)
  })

  it('swap the CDN domain', () => {
    const parsed = parseCdnUrl(stored)
    expect(
      serializeCdnUrl({ ...parsed, cdnBase: 'https://1zlmtnsbgr.ucarecd.net' })
    ).toBe(
      `https://1zlmtnsbgr.ucarecd.net/${uuid}/-/resize/300x/-/quality/smart/`
    )
  })

  it('download filename', () => {
    const file = parseCdnUrl(stored)
    expect(file.kind).toBe('file')
    if (file.kind === 'file') {
      expect(serializeCdnUrl({ ...file, filename: 'invoice-2026.pdf' })).toBe(
        `https://1s4oyld5dc.ucarecd.net/${uuid}/-/resize/300x/-/quality/smart/invoice-2026.pdf`
      )
    }
  })

  it('original file, no operations — and clearing a token', () => {
    expect(mapOperations(stored, () => [])).toBe(
      `https://1s4oyld5dc.ucarecd.net/${uuid}/`
    )
    const withToken = parseCdnUrl(`${stored}?token=abc123`)
    expect(serializeCdnUrl({ ...withToken, search: '' })).toBe(stored)
  })

  it('parseCdnUrl throws on non-CDN input', () => {
    expect(() => parseCdnUrl('not-a-url')).toThrow(TypeError)
    expect(() => parseCdnUrl('https://example.com/')).toThrow(TypeError)
  })

  it('the String level tab matches the other three, recipe by recipe', () => {
    // thumbnail from a uuid
    expect(
      tinyBuild({
        cdnBase,
        uuid,
        modifiers: modifiers('scale_crop/300x300/smart')
      })
    ).toBe(`${cdnBase}/${uuid}/-/scale_crop/300x300/smart/`)

    // swap the CDN domain
    expect(
      tinyBuild({
        ...tinyParse(stored),
        cdnBase: 'https://1zlmtnsbgr.ucarecd.net'
      })
    ).toBe(
      `https://1zlmtnsbgr.ucarecd.net/${uuid}/-/resize/300x/-/quality/smart/`
    )

    // download filename
    expect(
      tinyBuild({ ...tinyParse(stored), filename: 'invoice-2026.pdf' })
    ).toBe(`${cdnBase}/${uuid}/-/resize/300x/-/quality/smart/invoice-2026.pdf`)

    // original file, no operations — `modifiers()`, not ''
    expect(tinyBuild({ ...tinyParse(stored), modifiers: modifiers() })).toBe(
      `${cdnBase}/${uuid}/`
    )
  })
})

describe('cookbook: editing a chain', () => {
  it('change one operation and keep the rest', () => {
    expect(
      mapOperations(stored, (ops) =>
        ops.map((op) =>
          operationMatches(op, resize) ? resize({ width: 500 }) : op
        )
      )
    ).toBe(
      `https://1s4oyld5dc.ucarecd.net/${uuid}/-/resize/500x/-/quality/smart/`
    )
  })

  it('the functional form leaves a scale_crop chain alone', () => {
    const cropped = `https://1s4oyld5dc.ucarecd.net/${uuid}/-/scale_crop/300x300/smart/`
    expect(
      mapOperations(cropped, (ops) =>
        ops.map((op) =>
          operationMatches(op, resize) ? resize({ width: 500 }) : op
        )
      )
    ).toBe(cropped)
    // ...whereas the builder appends, exactly as the page warns
    expect(
      CdnUrl.parse(cropped)
        .replace(resize({ width: 500 }))
        .operations.map((op) => op.name)
    ).toEqual(['scale_crop', 'resize'])
  })

  it('change the second overlay, not the first', () => {
    const many = `https://1s4oyld5dc.ucarecd.net/${uuid}/-/overlay/${uuid}/10p,10p/-/overlay/${uuid}/20p,20p/-/overlay/${uuid}/30p,30p/`
    const replacement = overlay(uuid, { size: ['50p', '50p'] })
    let seen = 0
    expect(
      mapOperations(many, (ops) =>
        ops.map((op) =>
          operationMatches(op, overlay) && seen++ === 1 ? replacement : op
        )
      )
    ).toBe(
      `https://1s4oyld5dc.ucarecd.net/${uuid}/-/overlay/${uuid}/10p,10p/-/overlay/${uuid}/50px50p/-/overlay/${uuid}/30p,30p/`
    )
  })

  it('add an operation only if absent', () => {
    expect(
      mapOperations(stored, (ops) =>
        ops.some((op) => operationMatches(op, blur)) ? ops : [...ops, blur(10)]
      )
    ).toBe(
      `https://1s4oyld5dc.ucarecd.net/${uuid}/-/resize/300x/-/quality/smart/-/blur/10/`
    )
  })

  it('see what is in a URL', () => {
    const chain = parseCdnUrl(stored)
    const ops = 'operations' in chain ? chain.operations : []
    expect(ops.some((op) => operationMatches(op, blur))).toBe(false)
    expect(ops.find((op) => operationMatches(op, resize))).toEqual({
      name: 'resize',
      params: ['300x']
    })
    expect(ops.filter((op) => operationMatches(op, overlay))).toEqual([])
  })

  it('insert at the front, insert at an index, reorder', () => {
    expect(mapOperations(stored, (ops) => [blur(10), ...ops])).toBe(
      `https://1s4oyld5dc.ucarecd.net/${uuid}/-/blur/10/-/resize/300x/-/quality/smart/`
    )
    expect(
      mapOperations(stored, (ops) => [
        ...ops.slice(0, 1),
        blur(10),
        ...ops.slice(1)
      ])
    ).toBe(
      `https://1s4oyld5dc.ucarecd.net/${uuid}/-/resize/300x/-/blur/10/-/quality/smart/`
    )
    expect(mapOperations(stored, (ops) => ops.reverse())).toBe(
      `https://1s4oyld5dc.ucarecd.net/${uuid}/-/quality/smart/-/resize/300x/`
    )
  })

  it('edit a video conversion path', () => {
    const video = [size({ width: 720 }), thumbs(5)]
    const smaller = video.map((op) =>
      operationMatches(op, size) ? size({ width: 480 }) : op
    )
    expect(videoPath(uuid, smaller)).toBe(
      `/${uuid}/video/-/size/480x/-/thumbs~5/`
    )
    // the trap the page calls out
    expect(thumbs(5).name === 'thumbs').toBe(false)
    expect(operationMatches(thumbs(5), thumbs)).toBe(true)
  })
})

describe('cookbook: understanding a chain', () => {
  it('isStackable', () => {
    expect(isStackable(overlay)).toBe(true)
    expect(isStackable(quality)).toBe(false)
  })

  it('why text is not styled', () => {
    const styled = [
      font(24),
      textAlign('center', 'bottom'),
      text(['80p', '20p'], 'bottom', 'Hi')
    ]
    expect(
      operationInputs(styled, 'text').map((edge) => edge.operation.name)
    ).toEqual(['font', 'text_align'])
    expect(
      new Set(Object.keys(operationInputs(styled, 'text')[0] ?? {}))
    ).toEqual(new Set(['kind', 'operation', 'index', 'reason']))
  })

  it('domain classification', () => {
    expect(isUploadcareDomain('https://cdn.example.com')).toBe(false)
    expect(detectDomainKind('https://1zlmtnsbgr.ucarecd.net')).toBe('prefixed')
    expect(detectDomainKind('https://ucarecdn.com')).toBe('legacy')
    expect(detectDomainKind('https://x.ucr.io')).toBe('proxy')
    expect(detectDomainKind('https://cdn.example.com')).toBe('custom')
    expect(() => detectDomainKind('not-a-url')).toThrow(TypeError)
  })
})

describe('cookbook: surprising behaviour', () => {
  it('editing a signed URL keeps the now-invalid token', () => {
    const signed = `https://1s4oyld5dc.ucarecd.net/${uuid}/-/preview/300x300/?token=abc123`
    const edited = mapOperations(signed, (ops) => [
      ...ops,
      resize({ width: 400 })
    ])
    expect(edited).toContain('token=abc123')
    expect(edited).toContain('resize/400x')
  })

  it('parsing does not validate values', async () => {
    const { parseOperations } = await import('./index')
    expect(parseOperations('-/blur/99999/')).toEqual([
      { name: 'blur', params: ['99999'] }
    ])
  })
})

describe('cookbook: the chainable translation table', () => {
  const url = CdnUrl.parse(stored)

  it('every row does what the functional form does', () => {
    expect(url.updateOperations(() => []).href).toBe(
      mapOperations(stored, () => [])
    )
    expect(url.has(blur)).toBe(false)
    expect(url.get(resize)).toEqual({ name: 'resize', params: ['300x'] })
    expect(url.getAll(overlay)).toEqual([])
    expect(url.replace(resize({ width: 500 })).href).toBe(
      `https://1s4oyld5dc.ucarecd.net/${uuid}/-/resize/500x/-/quality/smart/`
    )
  })

  it('replaceAll appends on zero matches, as documented', () => {
    expect(
      url
        .replaceAll(overlay(uuid, { size: ['50p', '50p'] }))
        .operations.map((op) => op.name)
    ).toEqual(['resize', 'quality', 'overlay'])
  })

  it('updateOperations rejects a callback that returns no array', () => {
    expect(() =>
      // @ts-expect-error deliberately wrong callback shape
      url.updateOperations((ops) => {
        ops.push(blur(10))
      })
    ).toThrow(TypeError)
  })
})

// --- Builder and Fluent tabs -----------------------------------------------
describe('cookbook: Builder tab', () => {
  const url = CdnUrl.parse(stored)

  it('thumbnail, cdnBase, filename, strip', () => {
    expect(
      new CdnUrl({
        cdnBase,
        uuid,
        operations: [scaleCrop(300, 300, { type: 'smart' })]
      }).href
    ).toBe(`${cdnBase}/${uuid}/-/scale_crop/300x300/smart/`)
    expect(url.base('https://1zlmtnsbgr.ucarecd.net').href).toBe(
      `https://1zlmtnsbgr.ucarecd.net/${uuid}/-/resize/300x/-/quality/smart/`
    )
    expect(url.filename('invoice-2026.pdf').href).toBe(
      `${cdnBase}/${uuid}/-/resize/300x/-/quality/smart/invoice-2026.pdf`
    )
    expect(url.updateOperations(() => []).href).toBe(`${cdnBase}/${uuid}/`)
  })

  it('edit, inspect, insert, reorder', () => {
    expect(url.replace(resize({ width: 500 })).href).toBe(
      `${cdnBase}/${uuid}/-/resize/500x/-/quality/smart/`
    )
    const guarded = url.has(resize) ? url.replace(resize({ width: 500 })) : url
    expect(guarded.href).toBe(
      `${cdnBase}/${uuid}/-/resize/500x/-/quality/smart/`
    )
    const next = url.has(blur) ? url : url.with(blur(10))
    expect(next.href).toContain('/-/blur/10/')
    expect(url.has(blur)).toBe(false)
    expect(url.get(resize)).toEqual({ name: 'resize', params: ['300x'] })
    expect(url.getAll(overlay)).toEqual([])
    expect(url.updateOperations((ops) => [blur(10), ...ops]).href).toBe(
      `${cdnBase}/${uuid}/-/blur/10/-/resize/300x/-/quality/smart/`
    )
    expect(url.updateOperations((ops) => ops.reverse()).href).toBe(
      `${cdnBase}/${uuid}/-/quality/smart/-/resize/300x/`
    )
  })

  it('the second overlay', () => {
    const many = CdnUrl.parse(
      `${cdnBase}/${uuid}/-/overlay/${uuid}/10p,10p/-/overlay/${uuid}/20p,20p/`
    )
    const replacement = overlay(uuid, { size: ['50p', '50p'] })
    let seen = 0
    expect(
      many
        .updateOperations((ops) =>
          ops.map((op) =>
            operationMatches(op, overlay) && seen++ === 1 ? replacement : op
          )
        )
        .operations.map((op) => op.params[1])
    ).toEqual(['10p,10p', '50px50p'])
  })

  it('conversion yields a full URL, not a path', () => {
    expect(
      new CdnUrl({
        cdnBase,
        uuid,
        conversion: 'video',
        operations: [size({ width: 480 }), thumbs(5)]
      }).href
    ).toBe(`${cdnBase}/${uuid}/video/-/size/480x/-/thumbs~5/`)
  })

  it('signed url keeps the stale token', () => {
    const signed = `${cdnBase}/${uuid}/-/preview/300x300/?token=abc123`
    const edited = CdnUrl.parse(signed).with(resize({ width: 400 })).href
    expect(edited).toContain('token=abc123')
    expect(edited).toContain('resize/400x')
  })
})

describe('cookbook: Fluent tab', () => {
  const parsedChain = myCdn.parse(stored)
  if (parsedChain.kind !== 'file') throw new Error('expected a file url')
  const chain = parsedChain

  it('thumbnail, cdnBase, filename, strip', () => {
    expect(myCdn.file(uuid).scaleCrop(300, 300, { type: 'smart' }).href).toBe(
      `${cdnBase}/${uuid}/-/scale_crop/300x300/smart/`
    )
    expect(chain.base('https://1zlmtnsbgr.ucarecd.net').href).toBe(
      `https://1zlmtnsbgr.ucarecd.net/${uuid}/-/resize/300x/-/quality/smart/`
    )
    expect(chain.filename('invoice-2026.pdf').href).toBe(
      `${cdnBase}/${uuid}/-/resize/300x/-/quality/smart/invoice-2026.pdf`
    )
    expect(chain.updateOperations(() => []).href).toBe(`${cdnBase}/${uuid}/`)
  })

  it('edit, inspect, insert, reorder', () => {
    expect(chain.replaceOp(resize({ width: 500 })).href).toBe(
      `${cdnBase}/${uuid}/-/resize/500x/-/quality/smart/`
    )
    const next = chain.hasOp(blur) ? chain : chain.blur(10)
    expect(next.href).toContain('/-/blur/10/')
    expect(chain.hasOp(blur)).toBe(false)
    expect(chain.getOp(resize)).toEqual({ name: 'resize', params: ['300x'] })
    expect(chain.getAllOps(overlay)).toEqual([])
    expect(chain.updateOperations((ops) => [blur(10), ...ops]).href).toBe(
      `${cdnBase}/${uuid}/-/blur/10/-/resize/300x/-/quality/smart/`
    )
    expect(chain.updateOperations((ops) => ops.reverse()).href).toBe(
      `${cdnBase}/${uuid}/-/quality/smart/-/resize/300x/`
    )
  })

  it('video conversion path', () => {
    expect(
      cdn
        .video(uuid)
        .size({ width: 720 })
        .thumbs(5)
        .updateOperations((ops) =>
          ops.map((op) =>
            operationMatches(op, size) ? size({ width: 480 }) : op
          )
        ).path
    ).toBe(`/${uuid}/video/-/size/480x/-/thumbs~5/`)
  })

  it('signed url keeps the stale token', () => {
    const signed = `${cdnBase}/${uuid}/-/preview/300x300/?token=abc123`
    const s = myCdn.parse(signed)
    expect(s.kind).toBe('file')
    if (s.kind === 'file') {
      const edited = s.resize({ width: 400 }).href
      expect(edited).toContain('token=abc123')
      expect(edited).toContain('resize/400x')
    }
  })
})

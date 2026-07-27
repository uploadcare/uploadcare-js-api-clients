/**
 * Executes every snippet in `docs/how-to/cookbook.md` so the page cannot rot:
 * change the API and these fail before a reader hits a broken example. The
 * preamble below mirrors the page's own preamble block verbatim.
 */
import { describe, expect, it } from 'vitest'

import { CdnUrl } from './builder/index'
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
import type { CdnOperation } from './types'
import { size, thumbs, videoPath } from './video/index'
import { isStackable, operationInputs } from './validate/index'

// --- the page's preamble, verbatim -----------------------------------------
const uuid = 'c2499162-eb07-4b93-b31e-94a89a47e858'
const stored = `https://ucarecdn.com/${uuid}/-/resize/300x/-/quality/smart/`

function mapOperations(
  url: string,
  fn: (operations: CdnOperation[]) => CdnOperation[]
): string {
  const parsed = parseCdnUrl(url)
  if (!('operations' in parsed)) return url
  return serializeCdnUrl({ ...parsed, operations: fn([...parsed.operations]) })
}

describe('cookbook: getting a URL out', () => {
  it('thumbnail from a uuid', () => {
    expect(
      serializeCdnUrl({
        kind: 'file',
        origin: 'https://ucarecdn.com',
        uuid,
        conversion: null,
        operations: [scaleCrop(300, 300, { type: 'smart' })],
        filename: null,
        search: '',
        hash: ''
      })
    ).toBe(`https://ucarecdn.com/${uuid}/-/scale_crop/300x300/smart/`)
  })

  it('swap the CDN domain', () => {
    const parsed = parseCdnUrl(stored)
    expect(
      serializeCdnUrl({ ...parsed, origin: 'https://1zlmtnsbgr.ucarecd.net' })
    ).toBe(
      `https://1zlmtnsbgr.ucarecd.net/${uuid}/-/resize/300x/-/quality/smart/`
    )
  })

  it('download filename', () => {
    const file = parseCdnUrl(stored)
    expect(file.kind).toBe('file')
    if (file.kind === 'file') {
      expect(serializeCdnUrl({ ...file, filename: 'invoice-2026.pdf' })).toBe(
        `https://ucarecdn.com/${uuid}/-/resize/300x/-/quality/smart/invoice-2026.pdf`
      )
    }
  })

  it('original file, no operations — and clearing a token', () => {
    expect(mapOperations(stored, () => [])).toBe(
      `https://ucarecdn.com/${uuid}/`
    )
    const withToken = parseCdnUrl(`${stored}?token=abc123`)
    expect(serializeCdnUrl({ ...withToken, search: '' })).toBe(stored)
  })

  it('parseCdnUrl throws on non-CDN input', () => {
    expect(() => parseCdnUrl('not-a-url')).toThrow(TypeError)
    expect(() => parseCdnUrl('https://example.com/')).toThrow(TypeError)
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
    ).toBe(`https://ucarecdn.com/${uuid}/-/resize/500x/-/quality/smart/`)
  })

  it('the functional form leaves a scale_crop chain alone', () => {
    const cropped = `https://ucarecdn.com/${uuid}/-/scale_crop/300x300/smart/`
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
    const many = `https://ucarecdn.com/${uuid}/-/overlay/${uuid}/10p,10p/-/overlay/${uuid}/20p,20p/-/overlay/${uuid}/30p,30p/`
    const replacement = overlay(uuid, { size: ['50p', '50p'] })
    let seen = 0
    expect(
      mapOperations(many, (ops) =>
        ops.map((op) =>
          operationMatches(op, overlay) && seen++ === 1 ? replacement : op
        )
      )
    ).toBe(
      `https://ucarecdn.com/${uuid}/-/overlay/${uuid}/10p,10p/-/overlay/${uuid}/50px50p/-/overlay/${uuid}/30p,30p/`
    )
  })

  it('add an operation only if absent', () => {
    expect(
      mapOperations(stored, (ops) =>
        ops.some((op) => operationMatches(op, blur)) ? ops : [...ops, blur(10)]
      )
    ).toBe(
      `https://ucarecdn.com/${uuid}/-/resize/300x/-/quality/smart/-/blur/10/`
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
      `https://ucarecdn.com/${uuid}/-/blur/10/-/resize/300x/-/quality/smart/`
    )
    expect(
      mapOperations(stored, (ops) => [
        ...ops.slice(0, 1),
        blur(10),
        ...ops.slice(1)
      ])
    ).toBe(
      `https://ucarecdn.com/${uuid}/-/resize/300x/-/blur/10/-/quality/smart/`
    )
    expect(mapOperations(stored, (ops) => ops.reverse())).toBe(
      `https://ucarecdn.com/${uuid}/-/quality/smart/-/resize/300x/`
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
    const signed = `https://ucarecdn.com/${uuid}/-/preview/300x300/?token=abc123`
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
      `https://ucarecdn.com/${uuid}/-/resize/500x/-/quality/smart/`
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

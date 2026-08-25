/**
 * Executes every snippet on `docs/how-to/text-and-watermarks.md`, so the page
 * cannot promise a url the library does not build or a diagnostic it does not
 * emit.
 */
import { describe, expect, it } from 'vitest'

import { CdnUrl } from './builder/index'
import { serializeCdnUrl } from './index'
import { font, overlay, preview, text, textAlign, textBox } from './ops/index'
import { operationInputs, validateOperations } from './validate/index'

import {
  CDN_BASE as cdnBase,
  LOGO_UUID as logoUuid,
  myCdn,
  UUID as uuid
} from './docs-fixtures'

describe('text-and-watermarks: overlay a logo', () => {
  const options = {
    size: ['20p', '20p'],
    position: ['90p', '90p'],
    opacity: '60p'
  } as const
  const expected = `${cdnBase}/${uuid}/-/preview/1200x800/-/overlay/${logoUuid}/20px20p/90p,90p/60p/`

  it('all three tabs produce the documented URL', () => {
    expect(
      serializeCdnUrl({
        cdnBase,
        uuid,
        operations: [preview(1200, 800), overlay(logoUuid, options)]
      })
    ).toBe(expected)

    expect(
      new CdnUrl({ cdnBase, uuid }).with(
        preview(1200, 800),
        overlay(logoUuid, options)
      ).href
    ).toBe(expected)

    expect(
      myCdn.file(uuid).preview(1200, 800).overlay(logoUuid, options).href
    ).toBe(expected)
  })

  it('stacks overlays in chain order', () => {
    expect(
      serializeCdnUrl({
        cdnBase,
        uuid,
        operations: [
          overlay(logoUuid, { size: ['20p', '20p'], position: ['90p', '90p'] }),
          overlay(uuid, { size: ['10p', '10p'], position: 'top' })
        ]
      })
    ).toBe(
      `${cdnBase}/${uuid}/-/overlay/${logoUuid}/20px20p/90p,90p/-/overlay/${uuid}/10px10p/top/`
    )
  })

  it('overlays the image on itself for a blurred-edge fill', () => {
    expect(
      myCdn
        .file(uuid)
        .preview(800, 800)
        .overlay('self', {
          size: ['100p', '100p'],
          position: 'center',
          opacity: '30p'
        }).href
    ).toBe(
      `${cdnBase}/${uuid}/-/preview/800x800/-/overlay/self/100px100p/center/30p/`
    )
  })

  it('rejects the compound keywords the CDN does not have', () => {
    // 'se'/'nw' look plausible and are not in ALIGN_KEYWORDS
    expect(() =>
      // @ts-expect-error not an alignment keyword
      overlay(logoUuid, { size: ['20p', '20p'], position: 'se' })
    ).toThrow(RangeError)
  })

  it('enforces the positional rule at run time, not in the types', () => {
    // the options are all optional, so this compiles; the dev bundle catches it
    expect(() => overlay(logoUuid, { opacity: '60p' })).toThrow(
      /require a size/
    )
    expect(() => overlay(logoUuid, { position: 'center' })).toThrow(
      /require a size/
    )
  })
})

describe('text-and-watermarks: draw text', () => {
  const ops = [
    preview(1200, 630),
    font(48, 'ffffff'),
    textAlign('center', 'bottom'),
    textBox('fill', '00000080', 20),
    text(['80p', '30p'], 'bottom', 'Ship it on Friday')
  ]

  it('serializes the documented chain, atomic and fluent alike', () => {
    const expected = `${cdnBase}/${uuid}/-/preview/1200x630/-/font/48/ffffff/-/text_align/center/bottom/-/text_box/fill/00000080/20/-/text/80px30p/bottom/Ship it on Friday/`
    expect(serializeCdnUrl({ cdnBase, uuid, operations: ops })).toBe(expected)
    expect(
      myCdn
        .file(uuid)
        .preview(1200, 630)
        .font(48, 'ffffff')
        .textAlign('center', 'bottom')
        .textBox('fill', '00000080', 20)
        .text(['80p', '30p'], 'bottom', 'Ship it on Friday').href
    ).toBe(expected)
  })

  it('escapes a caption containing a url, so callers need not', () => {
    const withUrl = text(['80p', '30p'], 'bottom', 'see https://example.com/a')
    expect(withUrl.params[2]).toContain('~s')
    expect(withUrl.params[2]).not.toContain('/')
  })

  it('leaves a space a space — CDN escaping is not percent-encoding', () => {
    const spaced = text(['80p', '30p'], 'bottom', 'two words')
    expect(spaced.params[2]).toBe('two words')
    expect(serializeCdnUrl({ cdnBase, uuid, operations: [spaced] })).toContain(
      '/two words/'
    )
  })
})

describe('text-and-watermarks: the silent failure', () => {
  it('names what configures a text operation', () => {
    const styled = [
      font(48, 'ffffff'),
      textAlign('center', 'bottom'),
      textBox('fill', '00000080', 20),
      text(['80p', '30p'], 'bottom', 'Hello')
    ]
    expect(
      operationInputs(styled, 'text').map((e) => e.operation.name)
    ).toEqual(['font', 'text_align', 'text_box'])
  })

  it('reports a modifier with no target as the page claims', () => {
    const codes = validateOperations([font(48), preview(800, 600)]).map(
      (d) => d.code
    )
    expect(codes).toContain('modifier-without-target')
  })

  it('and stays quiet when the target is there', () => {
    const codes = validateOperations([
      font(48),
      text(['80p', '30p'], 'bottom', 'Hello')
    ]).map((d) => d.code)
    expect(codes).not.toContain('modifier-without-target')
  })
})

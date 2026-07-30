/**
 * Executes the code-group tabs added to the how-to pages, so each tab is
 * proven equivalent rather than assumed. Mirrors the snippets verbatim.
 */
import { describe, expect, it } from 'vitest'

import { CdnUrl } from './builder/index'
import { base, prefixedCdnBase } from './fluent/index'
import {
  joinModifiers,
  modifiers,
  normalizeModifiers,
  serializeCdnUrl,
  tinyBuild,
  tinyParse
} from './index'
import { archiveUrl, groupUrl, nthUrl } from './group/index'
import { borderRadius, preview, resize, scaleCrop } from './ops/index'
import { defaultProxyEndpoint, proxyUrl } from './proxy/index'
import { cut, format, quality, size, thumbs, videoPath } from './video/index'

const uuid = 'c2499162-eb07-4b93-b31e-94a89a47e858'
const CDN_BASE = 'https://1s4oyld5dc.ucarecd.net'
const group = { uuid, count: 3 }

const cdn = base(prefixedCdnBase('demopublickey'))

const fluentAvatar = (u: string, s: number) =>
  cdn
    .file(u)
    .scaleCrop(s, s, { type: 'smart_faces_objects' })
    .borderRadius('50p').href

const fluentVariant = (u: string, w: number) => cdn.file(u).preview(w, w).href

const tinyAvatar = (u: string, s: number) =>
  tinyBuild({
    cdnBase: CDN_BASE,
    uuid: u,
    modifiers: modifiers(
      `scale_crop/${s}x${s}/smart_faces_objects`,
      'border_radius/50p'
    )
  })

const tinyVariant = (u: string, w: number) =>
  tinyBuild({
    cdnBase: CDN_BASE,
    uuid: u,
    modifiers: modifiers(`preview/${w}x${w}`)
  })

describe('avatars: the four tabs agree', () => {
  const atomic = (u: string, s: number) =>
    serializeCdnUrl({
      cdnBase: CDN_BASE,
      uuid: u,
      operations: [
        scaleCrop(s, s, { type: 'smart_faces_objects' }),
        borderRadius('50p')
      ]
    })
  const builder = (u: string, s: number) =>
    new CdnUrl({
      cdnBase: CDN_BASE,
      uuid: u,
      operations: [
        scaleCrop(s, s, { type: 'smart_faces_objects' }),
        borderRadius('50p')
      ]
    }).href

  it('all four produce the documented URL', () => {
    const expected = `${CDN_BASE}/${uuid}/-/scale_crop/96x96/smart_faces_objects/-/border_radius/50p/`
    expect(atomic(uuid, 96)).toBe(expected)
    expect(builder(uuid, 96)).toBe(expected)
    expect(fluentAvatar(uuid, 96)).toBe(expected)
    expect(tinyAvatar(uuid, 96)).toBe(expected)
  })
})

describe('responsive images: the four tabs agree', () => {
  const WIDTHS = [320, 640, 960, 1280, 1920]
  const atomic = (u: string, w: number) =>
    serializeCdnUrl({ cdnBase: CDN_BASE, uuid: u, operations: [preview(w, w)] })
  const builder = (u: string, w: number) =>
    new CdnUrl({ cdnBase: CDN_BASE, uuid: u, operations: [preview(w, w)] }).href

  it('all four produce the same srcset', () => {
    const build = (v: (u: string, w: number) => string) =>
      WIDTHS.map((w) => `${v(uuid, w)} ${w}w`).join(', ')
    expect(build(atomic)).toBe(build(builder))
    expect(build(atomic)).toBe(build(fluentVariant))
    expect(build(atomic)).toBe(build(tinyVariant))
    expect(atomic(uuid, 320)).toBe(`${CDN_BASE}/${uuid}/-/preview/320x320/`)
  })
})

describe('render stored urls: the string-level alternatives', () => {
  const legacy = 'https://ucarecdn.com'
  const storedUrl = `${legacy}/${uuid}/-/crop/640x480/130,80/photo.jpg`

  it('appends to a stored full URL', () => {
    const parts = tinyParse(storedUrl)
    expect(
      tinyBuild({
        ...parts,
        modifiers: joinModifiers(parts.modifiers, modifiers('preview/400x400'))
      })
    ).toBe(
      `${legacy}/${uuid}/-/crop/640x480/130,80/-/preview/400x400/photo.jpg`
    )
  })

  it('builds from a stored uuid alone', () => {
    expect(
      tinyBuild({
        cdnBase: legacy,
        uuid,
        modifiers: modifiers('preview/400x400')
      })
    ).toBe(`${legacy}/${uuid}/-/preview/400x400/`)
  })

  it('accepts a stored modifiers column in any shape integrations save it', () => {
    const expected = `${legacy}/${uuid}/-/crop/640x480/130,80/-/preview/400x400/`
    for (const column of [
      '-/crop/640x480/130,80/',
      'crop/640x480/130,80',
      '/crop/640x480/130,80/'
    ]) {
      expect(
        tinyBuild({
          cdnBase: legacy,
          uuid,
          modifiers: joinModifiers(
            normalizeModifiers(column),
            modifiers('preview/400x400')
          )
        })
      ).toBe(expected)
    }
  })
})

describe('groups: addressing tabs agree', () => {
  it('group root', () => {
    const expected = `${CDN_BASE}/${uuid}~3/`
    expect(groupUrl(CDN_BASE, group)).toBe(expected)
    expect(new CdnUrl({ cdnBase: CDN_BASE, group }).href).toBe(expected)
    expect(cdn.group(group).href).toBe(expected)
  })

  it('nth element with operations', () => {
    const expected = `${CDN_BASE}/${uuid}~3/nth/1/-/preview/400x400/`
    expect(nthUrl(CDN_BASE, group, 1, [preview(400, 400)])).toBe(expected)
    expect(
      new CdnUrl({
        cdnBase: CDN_BASE,
        group,
        nth: 1,
        operations: [preview(400, 400)]
      }).href
    ).toBe(expected)
    expect(cdn.group(group).nth(1).preview(400, 400).href).toBe(expected)
  })

  it('nth is zero-based', () => {
    expect(nthUrl(CDN_BASE, group, 0)).toBe(`${CDN_BASE}/${uuid}~3/nth/0/`)
  })

  it('archives: atomic and fluent agree, and the builder has no archive', () => {
    expect(archiveUrl(CDN_BASE, group, 'zip')).toBe(
      `${CDN_BASE}/${uuid}~3/archive/zip/`
    )
    expect(cdn.group(group).archive('zip')).toBe(
      `${CDN_BASE}/${uuid}~3/archive/zip/`
    )
    expect(archiveUrl(CDN_BASE, group, 'tar', 'photos.tar')).toBe(
      `${CDN_BASE}/${uuid}~3/archive/tar/photos.tar`
    )
    expect(cdn.group(group).archive('tar', 'photos.tar')).toBe(
      `${CDN_BASE}/${uuid}~3/archive/tar/photos.tar`
    )
    // the page says there is no builder tab because the method does not exist
    expect('archive' in CdnUrl.prototype).toBe(false)
  })
})

describe('proxy: the three tabs agree', () => {
  const source = 'https://yoursite.com/assets/hero.jpg'
  const endpoint = defaultProxyEndpoint('YOUR_PUBLIC_KEY')

  it('endpoint shape', () => {
    expect(endpoint).toBe('https://YOUR_PUBLIC_KEY.ucr.io')
  })

  it('all three produce the documented URL', () => {
    const expected = `https://YOUR_PUBLIC_KEY.ucr.io/-/preview/-/resize/1280x/${source}`
    expect(
      proxyUrl(endpoint, source, [preview(), resize({ width: 1280 })])
    ).toBe(expected)
    expect(
      new CdnUrl({
        cdnBase: endpoint,
        sourceUrl: source,
        operations: [preview(), resize({ width: 1280 })]
      }).href
    ).toBe(expected)
    expect(
      cdn.proxy(endpoint, source).preview().resize({ width: 1280 }).href
    ).toBe(expected)
  })
})

describe('video: atomic and fluent agree; the builder differs by design', () => {
  const expected = `/${uuid}/video/-/size/720x540/-/format/webm/-/quality/better/-/cut/0:0:10.0/30.0/-/thumbs~5/`

  it('atomic videoPath', () => {
    expect(
      videoPath(uuid, [
        size({ width: 720, height: 540 }),
        format('webm'),
        quality('better'),
        cut('0:0:10.0', '30.0'),
        thumbs(5)
      ])
    ).toBe(expected)
  })

  it('fluent chain', () => {
    expect(
      cdn
        .video(uuid)
        .size({ width: 720, height: 540 })
        .format('webm')
        .quality('better')
        .cut('0:0:10.0', '30.0')
        .thumbs(5).path
    ).toBe(expected)
  })

  it('the builder yields a full URL, which is why the page omits that tab', () => {
    const built = new CdnUrl({
      cdnBase: CDN_BASE,
      uuid,
      conversion: 'video',
      operations: [size({ width: 720, height: 540 })]
    }).href
    expect(built.startsWith('https://')).toBe(true)
    expect(built).toBe(`${CDN_BASE}/${uuid}/video/-/size/720x540/`)
  })
})

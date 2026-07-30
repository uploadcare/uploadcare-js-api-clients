/**
 * A trailing slash on `cdnBase` is tolerated by every entry that accepts one —
 * config files, `new URL(x).origin + '/'` and hand-typed CNAMEs all produce them.
 * The trimming lives in `trimTrailingSlashes`, but each entry has to call it, so
 * this pins the whole public surface at once rather than trusting that the next
 * cdnBase-accepting function remembers.
 */
import { describe, expect, it } from 'vitest'

import { CdnUrl } from './builder/index'
import { cdn, prefixedCdnBase } from './fluent/index'
import { gif2videoUrl } from './gif2video/index'
import { archiveUrl, groupUrl, nthUrl } from './group/index'
import {
  serializeCdnUrl,
  serializeFileUrl,
  serializeGroupUrl,
  serializeProxyUrl,
  tinyBuild
} from './index'
import { proxyUrl } from './proxy/index'

const UUID = 'c2499162-eb07-4b93-b31e-94a89a47e858'
const GROUP = { uuid: UUID, count: 3 }
const SOURCE = 'https://example.com/a.jpg'

// Any base will do for the `on()` rows — each one replaces it.
const myCdn = cdn.base('https://other.example')

// Bare, one slash, and several: `trimTrailingSlashes` takes them all.
const CDN_BASES = [
  'https://ucarecdn.com',
  'https://ucarecdn.com/',
  'https://ucarecdn.com///'
]

const cases: [name: string, build: (cdnBase: string) => string][] = [
  ['serializeCdnUrl', (cdnBase) => serializeCdnUrl({ cdnBase, uuid: UUID })],
  ['serializeFileUrl', (cdnBase) => serializeFileUrl({ cdnBase, uuid: UUID })],
  ['tinyBuild', (cdnBase) => tinyBuild({ cdnBase, uuid: UUID })],
  ['CdnUrl constructor', (cdnBase) => new CdnUrl({ cdnBase, uuid: UUID }).href],
  [
    'CdnUrl.base',
    (cdnBase) =>
      new CdnUrl({ cdnBase: 'https://other.example', uuid: UUID }).base(cdnBase)
        .href
  ],
  ['cdn.base(cdnBase)', (cdnBase) => cdn.base(cdnBase).file(UUID).href],
  ['chain.base()', (cdnBase) => myCdn.file(UUID).base(cdnBase).href],
  [
    'gif2video chain.base()',
    (cdnBase) => myCdn.gif2video(UUID).base(cdnBase).format('webm').href
  ],
  ['gif2videoUrl', (cdnBase) => gif2videoUrl(cdnBase, UUID, [])]
]

const groupCases: [name: string, build: (cdnBase: string) => string][] = [
  [
    'serializeGroupUrl',
    (cdnBase) => serializeGroupUrl({ cdnBase, group: GROUP })
  ],
  ['groupUrl', (cdnBase) => groupUrl(cdnBase, GROUP)],
  ['nthUrl', (cdnBase) => nthUrl(cdnBase, GROUP, 1)],
  ['archiveUrl', (cdnBase) => archiveUrl(cdnBase, GROUP, 'zip')],
  ['group chain.base()', (cdnBase) => myCdn.group(GROUP).base(cdnBase).href],
  [
    'group element chain.base()',
    (cdnBase) => myCdn.group(GROUP).base(cdnBase).nth(1).href
  ],
  [
    'group archive via chain',
    (cdnBase) => myCdn.group(GROUP).base(cdnBase).archive('zip')
  ]
]

const proxyCases: [name: string, build: (cdnBase: string) => string][] = [
  [
    'serializeProxyUrl',
    (cdnBase) => serializeProxyUrl({ cdnBase, sourceUrl: SOURCE })
  ],
  ['proxyUrl', (cdnBase) => proxyUrl(cdnBase, SOURCE)],
  [
    'proxy chain.proxy()',
    (cdnBase) => myCdn.proxy('https://pk.ucr.io', SOURCE).proxy(cdnBase).href
  ]
]

it('prefixedCdnBase trims before prefixing', () => {
  for (const cdnBase of CDN_BASES) {
    expect(prefixedCdnBase('demopublickey', cdnBase)).toBe(
      'https://1s4oyld5dc.ucarecdn.com'
    )
  }
})

describe('every cdnBase-accepting entry trims trailing slashes', () => {
  for (const [name, build] of [...cases, ...groupCases, ...proxyCases]) {
    it(name, () => {
      const [bare, ...withSlashes] = CDN_BASES
      if (bare === undefined) throw new Error('empty CDN_BASES')
      const expected = build(bare)
      expect(expected).not.toContain('.com//')
      for (const cdnBase of withSlashes) {
        expect(build(cdnBase)).toBe(expected)
      }
    })
  }
})

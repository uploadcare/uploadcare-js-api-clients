/**
 * The `docs/how-to/signed-urls.md` signing snippet, executed. It uses
 * `node:crypto` because signing belongs on a server, which is why this file is
 * Node-only and excluded from the Chromium project.
 *
 * Whether the CDN accepts the token is Uploadcare's to verify; what is pinned
 * here is that the snippet runs, is deterministic, and produces a url this
 * library round-trips.
 */
import { createHmac } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { parseCdnUrl, serializeCdnUrl } from './index'
import { preview } from './ops/index'

const uuid = 'c2499162-eb07-4b93-b31e-94a89a47e858'
const cdnBase = 'https://1s4oyld5dc.ucarecd.net'

// The page's snippet, with a fixed clock in place of `Date.now()`.
const signedUrl = (href: string, secret: string, ttl: number): string => {
  const { pathname } = new URL(href)
  const exp = 1735689600 + ttl
  const acl = pathname
  const hmac = createHmac('sha256', Buffer.from(secret, 'hex'))
    .update(`exp=${exp}~acl=${acl}`)
    .digest('hex')
  return `${href}?token=exp=${exp}~acl=${acl}~hmac=${hmac}`
}

describe('signed-urls: the signing snippet', () => {
  it('produces a url this library round-trips', () => {
    const href = serializeCdnUrl({
      cdnBase,
      uuid,
      operations: [preview(800, 600)]
    })
    const out = signedUrl(href, 'deadbeefcafe', 600)

    expect(out).toContain('~hmac=')
    expect(serializeCdnUrl(parseCdnUrl(out))).toBe(out)
    const parsed = parseCdnUrl(out)
    expect(parsed.search).toContain(`acl=/${uuid}/-/preview/800x600/`)
    // deterministic: same inputs, same token
    expect(signedUrl(href, 'deadbeefcafe', 600)).toBe(out)
  })

  it('the slot-rounded expiry is stable inside a slot', () => {
    const SLOT = 15 * 60
    const round = (nowMs: number) =>
      Math.floor(nowMs / 1000 / SLOT) * SLOT + 3600
    const base = 1735689600000
    expect(round(base)).toBe(round(base + 60_000))
    expect(round(base)).not.toBe(round(base + SLOT * 1000))
  })
})

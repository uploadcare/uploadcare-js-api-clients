import { describe, expect, it } from 'vitest'
import { getTokenExpiration } from './getTokenExpiration'

const tokenWithPayload = (payload: unknown) =>
  `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`

describe('getTokenExpiration', () => {
  it('reads `exp`', () => {
    expect(getTokenExpiration(tokenWithPayload({ exp: 1700000000 }))).toBe(
      1700000000
    )
  })

  it.each([
    ['a token with no payload segment', 'notajwt'],
    ['an unparseable payload', 'header.@@@.signature'],
    ['a payload without exp', tokenWithPayload({ a: 1 })],
    ['a non-numeric exp', tokenWithPayload({ exp: '1700000000' })],
    ['a payload that is not an object', tokenWithPayload('nope')]
  ])('returns undefined for %s', (_name, token) => {
    expect(getTokenExpiration(token)).toBeUndefined()
  })
})

import { describe, expect, it } from 'vitest'

import { GROUP_ID_RE, UUID_RE } from './grammar'

const UUID = 'c2499162-eb07-4b93-b31e-94a89a47e858'

/**
 * `UUID_RE` and `GROUP_ID_RE` are regex literals rather than one composed source
 * string, so that an unused one can be tree-shaken (esbuild keeps `new RegExp(...)`
 * even when marked pure). That duplicates the uuid pattern, and these tests are what
 * keeps the two copies honest: edit one and a failure here says to edit the other.
 */
describe('uuid grammar', () => {
  it('accepts a canonical uuid', () => {
    expect(UUID_RE.test(UUID)).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(UUID_RE.test(UUID.toUpperCase())).toBe(true)
  })

  it('is anchored at both ends', () => {
    expect(UUID_RE.test(`x${UUID}`)).toBe(false)
    expect(UUID_RE.test(`${UUID}x`)).toBe(false)
  })

  it.each([
    ['too few groups', 'c2499162-eb07-4b93-b31e'],
    ['a non-hex character', 'g2499162-eb07-4b93-b31e-94a89a47e858'],
    ['a wrong group length', 'c249916-eb07-4b93-b31e-94a89a47e858'],
    ['a group id', `${UUID}~2`],
    ['empty', '']
  ])('rejects %s', (_label, value) => {
    expect(UUID_RE.test(value)).toBe(false)
  })
})

describe('group id grammar', () => {
  it('captures the uuid and the count', () => {
    const match = `${UUID}~11`.match(GROUP_ID_RE)
    expect(match?.[1]).toBe(UUID)
    expect(match?.[2]).toBe('11')
  })

  it('rejects a plain uuid, which is not a group', () => {
    expect(GROUP_ID_RE.test(UUID)).toBe(false)
  })

  it.each([
    ['a missing count', `${UUID}~`],
    ['a non-numeric count', `${UUID}~x`],
    ['a negative count', `${UUID}~-1`]
  ])('rejects %s', (_label, value) => {
    expect(GROUP_ID_RE.test(value)).toBe(false)
  })

  it('agrees with UUID_RE on the uuid part', () => {
    // The pattern is written out in both literals; this is the guard against them
    // drifting. Whatever `GROUP_ID_RE` captures as a uuid must be one.
    const match = `${UUID}~3`.match(GROUP_ID_RE)
    expect(match).not.toBeNull()
    expect(UUID_RE.test(match?.[1] ?? '')).toBe(true)
  })

  it('rejects a group id whose uuid part UUID_RE would reject', () => {
    expect(GROUP_ID_RE.test('g2499162-eb07-4b93-b31e-94a89a47e858~3')).toBe(
      false
    )
  })
})

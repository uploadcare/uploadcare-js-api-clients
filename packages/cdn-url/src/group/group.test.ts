import { describe, expect, it } from 'vitest'

import {
  archiveUrl,
  formatGroupId,
  groupUrl,
  nthUrl,
  parseGroupId
} from './index'

const UUID = 'c2499162-eb07-4b93-b31e-94a89a47e858'

describe('parseGroupId', () => {
  it('parses uuid~count ids', () => {
    expect(parseGroupId(`${UUID}~11`)).toEqual({ uuid: UUID, count: 11 })
  })

  it('throws on malformed ids', () => {
    expect(() => parseGroupId(UUID)).toThrow(TypeError)
    expect(() => parseGroupId(`${UUID}~`)).toThrow(TypeError)
    expect(() => parseGroupId('nonsense~2')).toThrow(TypeError)
  })
})

describe('formatGroupId', () => {
  it('formats back to uuid~count', () => {
    expect(formatGroupId({ uuid: UUID, count: 3 })).toBe(`${UUID}~3`)
  })
})

describe('group urls', () => {
  const group = { uuid: UUID, count: 3 }

  it('groupUrl builds the group root url', () => {
    expect(groupUrl('https://ucarecdn.com', group)).toBe(
      `https://ucarecdn.com/${UUID}~3/`
    )
  })

  it('nthUrl addresses elements with optional operations', () => {
    expect(nthUrl('https://ucarecdn.com', group, 1)).toBe(
      `https://ucarecdn.com/${UUID}~3/nth/1/`
    )
    expect(
      nthUrl('https://ucarecdn.com', group, 1, [
        { name: 'resize', params: ['256x'] }
      ])
    ).toBe(`https://ucarecdn.com/${UUID}~3/nth/1/-/resize/256x/`)
  })

  it('nthUrl validates the index against the group count', () => {
    expect(() => nthUrl('https://ucarecdn.com', group, 3)).toThrow(RangeError)
    expect(() => nthUrl('https://ucarecdn.com', group, -1)).toThrow(RangeError)
  })

  it('archiveUrl builds zip/tar archive urls with optional filename', () => {
    expect(archiveUrl('https://ucarecdn.com', group, 'zip')).toBe(
      `https://ucarecdn.com/${UUID}~3/archive/zip/`
    )
    expect(archiveUrl('https://ucarecdn.com', group, 'tar', 'all.tar')).toBe(
      `https://ucarecdn.com/${UUID}~3/archive/tar/all.tar`
    )
    // @ts-expect-error rar is not supported
    expect(() => archiveUrl('https://ucarecdn.com', group, 'rar')).toThrow(
      RangeError
    )
  })
})

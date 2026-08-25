import { describe, expect, it } from 'vitest'

import { cropByRatio, quality } from './ops/index'
import {
  operationBaseName,
  operationMatches,
  operationNameOf
} from './operation-ref'
import { thumbs } from './video/index'

describe('operationNameOf', () => {
  it('resolves strings, operations and creators', () => {
    expect(operationNameOf('resize')).toBe('resize')
    expect(operationNameOf({ name: 'resize', params: [] })).toBe('resize')
    expect(operationNameOf(quality)).toBe('quality')
    expect(operationNameOf(cropByRatio)).toBe('crop')
  })
})

describe('operationBaseName', () => {
  it('strips counted suffixes', () => {
    expect(operationBaseName('thumbs~5')).toBe('thumbs')
    expect(operationBaseName(thumbs(20))).toBe('thumbs')
  })

  it('leaves plain names alone', () => {
    expect(operationBaseName('resize')).toBe('resize')
    expect(operationBaseName(cropByRatio)).toBe('crop')
  })
})

describe('operationMatches', () => {
  it('matches on the exact name', () => {
    expect(operationMatches({ name: 'resize', params: [] }, 'resize')).toBe(
      true
    )
    expect(operationMatches({ name: 'resize', params: [] }, 'preview')).toBe(
      false
    )
  })

  it('matches a counted operation against its base-name ref', () => {
    expect(operationMatches(thumbs(5), 'thumbs')).toBe(true)
  })

  it('is symmetric: a counted ref matches the base name too', () => {
    expect(operationMatches({ name: 'thumbs', params: [] }, 'thumbs~5')).toBe(
      true
    )
  })

  it('matches two differently-counted operations', () => {
    expect(operationMatches(thumbs(5), thumbs(3))).toBe(true)
  })

  it('does not match unrelated names that share a prefix', () => {
    expect(
      operationMatches({ name: 'thumbsomething', params: [] }, 'thumbs')
    ).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { base64urlDecode } from './base64url'

const encode = (text: string) => Buffer.from(text).toString('base64url')

describe('base64urlDecode', () => {
  it('decodes a segment back to its text', () => {
    expect(base64urlDecode(encode('{"exp":1}'))).toBe('{"exp":1}')
  })

  it.each([0, 1, 2, 3])('handles a length needing %i padding chars', (pad) => {
    const text = 'a'.repeat(pad + 1)
    expect(base64urlDecode(encode(text))).toBe(text)
  })

  it('decodes the url-safe alphabet', () => {
    // A payload whose standard base64 contains both `+` and `/`, which
    // base64url replaces with `-` and `_`.
    const text = '<<??>>~~ÿ'
    const segment = encode(text)
    expect(segment).not.toMatch(/[+/=]/)
    expect(base64urlDecode(segment)).toBe(text)
  })

  it('decodes multi-byte characters as text, not bytes', () => {
    expect(base64urlDecode(encode('{"sub":"café"}'))).toBe('{"sub":"café"}')
  })
})

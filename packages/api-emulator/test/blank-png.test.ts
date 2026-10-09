import { inflateSync } from 'node:zlib'
import { expect, it } from 'vitest'
import { blankPng } from '../src/state/blank-png.js'
import { imageSize } from '../src/state/image-size.js'

/** The concatenated IDAT data of a PNG. */
const idatOf = (png: Uint8Array) => {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
  const parts: Uint8Array[] = []
  for (let offset = 8; offset < png.length; ) {
    const length = view.getUint32(offset)
    const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8))
    if (type === 'IDAT')
      parts.push(png.subarray(offset + 8, offset + 8 + length))
    offset += 12 + length
  }
  return Buffer.concat(parts)
}

// 2048×2048 is past one 65535-byte stored block, which a browser would
// render from the first block alone: only a strict inflate notices.
it.each([
  [3, 2],
  [2048, 2048]
])('draws %i×%i, with every scanline inflating back out', (width, height) => {
  const png = blankPng(width, height)
  expect(imageSize(png)).toEqual({ width, height, format: 'PNG' })
  expect(inflateSync(idatOf(png)).byteLength).toBe(
    height * (1 + Math.ceil(width / 8))
  )
})

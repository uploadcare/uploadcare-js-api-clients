/**
 * A blank `width`×`height` PNG, for an image the emulator has to make up at a
 * size it doesn't have (a derivative drawn at the requested ratio): 1-bit
 * grayscale, all black, deflated with stored blocks, so it needs no codec and
 * stays browser-safe. Any decoder reads it; `imageSize` reads its IHDR.
 */
export const blankPng = (width: number, height: number): Uint8Array => {
  const row = 1 + Math.ceil(width / 8) // a filter byte, then the pixels
  const raw = new Uint8Array(row * height) // all zero: filter none, black
  return concat([
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', [...u32(width), ...u32(height), 1, 0, 0, 0, 0]),
    chunk('IDAT', zlibStored(raw)),
    chunk('IEND', [])
  ])
}

const u32 = (value: number) => [
  (value >>> 24) & 0xff,
  (value >>> 16) & 0xff,
  (value >>> 8) & 0xff,
  value & 0xff
]

const concat = (parts: ArrayLike<number>[]) => {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

const crc32 = (bytes: Uint8Array) => {
  let c = 0xffffffff
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const chunk = (type: string, data: ArrayLike<number>) => {
  const body = concat([new TextEncoder().encode(type), data])
  return concat([u32(data.length), body, u32(crc32(body))])
}

/** A zlib stream of `raw` in uncompressed (stored) deflate blocks. */
const zlibStored = (raw: Uint8Array) => {
  const parts: ArrayLike<number>[] = [[0x78, 0x01]]
  const MAX = 0xffff
  for (let offset = 0; offset < raw.length; offset += MAX) {
    const block = raw.subarray(offset, offset + MAX)
    const final = offset + MAX >= raw.length ? 1 : 0
    const length = block.length
    parts.push(
      [
        final,
        length & 0xff,
        length >> 8,
        ~length & 0xff,
        (~length >> 8) & 0xff
      ],
      block
    )
  }
  let a = 1
  let b = 0
  for (const byte of raw) {
    a = (a + byte) % 65521
    b = (b + a) % 65521
  }
  parts.push(u32(((b << 16) | a) >>> 0))
  return concat(parts)
}

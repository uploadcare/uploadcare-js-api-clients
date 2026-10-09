import {
  array,
  assert,
  constantFrom,
  oneof,
  property,
  tuple,
  uint8Array
} from 'fast-check'
import { expect, it } from 'vitest'
import { resetSession } from '../src/index.js'
import { imageSize } from '../src/state/image-size.js'
import { call, upload } from './emulator.js'

// Signature, then an IHDR chunk (length, type) whose first fields are a 3×5
// width and height, plus one padding byte.
const PNG_3X5 = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44,
  0x52, 0, 0, 0, 3, 0, 0, 0, 5, 0
])

// "GIF89a", then a little-endian 0x0102 × 0x0304 logical screen.
const GIF = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x02, 0x01, 0x04, 0x03, 0
])

it('reads PNG dimensions out of IHDR', () => {
  expect(imageSize(PNG_3X5)).toEqual({ width: 3, height: 5, format: 'PNG' })
})

it('reads GIF dimensions little-endian', () => {
  expect(imageSize(GIF)).toEqual({ width: 258, height: 772, format: 'GIF' })
})

// Each format's signature, then random chunks, with runs of zeros and a
// start-of-frame marker mixed in: uniform random bytes almost never put a zero
// dimension or a JPEG frame where a decoder reads.
const SIGNATURES = [
  [0x89, 0x50, 0x4e, 0x47],
  [0x47, 0x49, 0x46],
  [0xff, 0xd8]
]
const chunk = oneof(
  uint8Array({ maxLength: 8 }),
  constantFrom(new Uint8Array(4), new Uint8Array([0xff, 0xc0]))
)
const bytes = tuple(
  constantFrom([], ...SIGNATURES),
  array(chunk, { maxLength: 12 })
).map(
  ([signature, chunks]) =>
    new Uint8Array([...signature, ...chunks.flatMap((c) => [...c])])
)
const isDimension = (n: number) => Number.isInteger(n) && n > 0

it('reads any bytes, truncated or garbage, as positive dimensions or a non-image', () => {
  assert(
    property(bytes, (input) => {
      const image = imageSize(input)
      return (
        image === undefined ||
        (isDimension(image.width) && isDimension(image.height))
      )
    })
  )
})

it('reports what the bytes are, not the declared type', async () => {
  resetSession()
  const file = await upload({ bytes: PNG_3X5, name: 'square.jpg' })
  const info = await call(
    `https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=${file}`
  )
  expect(await info.json()).toMatchObject({
    image_info: { format: 'PNG', width: 3, height: 5 }
  })
})

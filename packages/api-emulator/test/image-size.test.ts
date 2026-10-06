import { expect, it } from 'vitest'
import { handle, resetSession } from '../src/index.js'
import { imageSize } from '../src/state/image-size.js'

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

it('reports what the bytes are, not the declared type', async () => {
  resetSession()
  const body = new FormData()
  body.set('UPLOADCARE_PUB_KEY', 'demopublickey')
  body.set('file', new File([PNG_3X5], 'square.jpg', { type: 'image/jpeg' }))
  const uploaded = await handle(
    new Request('https://upload.uploadcare.com/base/', { method: 'POST', body })
  )
  const { file } = (await uploaded!.json()) as { file: string }

  const info = await handle(
    new Request(
      `https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=${file}`
    )
  )
  expect(await info!.json()).toMatchObject({
    image_info: { format: 'PNG', width: 3, height: 5 }
  })
})

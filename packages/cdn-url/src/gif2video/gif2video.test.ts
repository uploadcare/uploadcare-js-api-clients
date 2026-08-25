import { describe, expect, it } from 'vitest'

import { format, gif2videoUrl, quality } from './index'

const UUID = 'c2499162-eb07-4b93-b31e-94a89a47e858'

describe('gif2video', () => {
  it('format accepts only mp4 and webm', () => {
    expect(format('mp4')).toEqual({ name: 'format', params: ['mp4'] })
    expect(format('webm')).toEqual({ name: 'format', params: ['webm'] })
    // @ts-expect-error ogg is video-only, not gif2video
    expect(() => format('ogg')).toThrow(RangeError)
  })

  it('quality validates the enum', () => {
    expect(quality('lighter')).toEqual({ name: 'quality', params: ['lighter'] })
  })

  it('gif2videoUrl builds the conversion url without -/ after uuid', () => {
    expect(
      gif2videoUrl('https://ucarecdn.com', UUID, [
        format('webm'),
        quality('better')
      ])
    ).toBe(
      `https://ucarecdn.com/${UUID}/gif2video/-/format/webm/-/quality/better/`
    )
  })

  it('gif2videoUrl without operations', () => {
    expect(gif2videoUrl('https://ucarecdn.com', UUID)).toBe(
      `https://ucarecdn.com/${UUID}/gif2video/`
    )
  })
})

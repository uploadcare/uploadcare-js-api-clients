import { describe, expect, it } from 'vitest'

import { cut, format, quality, size, thumbs, videoPath } from './index'

const UUID = 'c2499162-eb07-4b93-b31e-94a89a47e858'

describe('video conversion operations', () => {
  it('size requires dimensions divisible by 4', () => {
    expect(size({ width: 720, height: 540 })).toEqual({
      name: 'size',
      params: ['720x540']
    })
    expect(size({ width: 720 })).toEqual({ name: 'size', params: ['720x'] })
    expect(size({ height: 540 })).toEqual({ name: 'size', params: ['x540'] })
    expect(() => size({ width: 721 })).toThrow(RangeError)
    expect(() => size({ height: 543 })).toThrow(RangeError)
    expect(() => size({})).toThrow(TypeError)
  })

  it('size accepts a resize mode', () => {
    expect(size({ width: 512, height: 384, mode: 'scale_crop' })).toEqual({
      name: 'size',
      params: ['512x384', 'scale_crop']
    })
    // @ts-expect-error invalid mode
    expect(() => size({ width: 512, mode: 'cover' })).toThrow(RangeError)
  })

  it('quality and format validate enums', () => {
    expect(quality('lightest')).toEqual({
      name: 'quality',
      params: ['lightest']
    })
    expect(format('webm')).toEqual({ name: 'format', params: ['webm'] })
    // @ts-expect-error invalid format
    expect(() => format('avi')).toThrow(RangeError)
  })

  it('cut accepts HHH:MM:SS.sss or seconds, and the end keyword', () => {
    expect(cut('1:2:40.535', '2:20.0')).toEqual({
      name: 'cut',
      params: ['1:2:40.535', '2:20.0']
    })
    expect(cut('3760.535', 'end')).toEqual({
      name: 'cut',
      params: ['3760.535', 'end']
    })
    expect(() => cut('not-a-time', '10')).toThrow(RangeError)
  })

  it('thumbs validates 1..50', () => {
    expect(thumbs(20)).toEqual({ name: 'thumbs~20', params: [] })
    expect(thumbs(1, { fromFirstFrame: true })).toEqual({
      name: 'thumbs~1',
      params: ['yes']
    })
    expect(() => thumbs(0)).toThrow(RangeError)
    expect(() => thumbs(51)).toThrow(RangeError)
  })
})

describe('videoPath', () => {
  it('builds a domain-less conversion path for the REST convert API', () => {
    expect(
      videoPath(UUID, [size({ width: 720, height: 540 }), format('webm')])
    ).toBe(`/${UUID}/video/-/size/720x540/-/format/webm/`)
  })

  it('builds a bare path without operations', () => {
    expect(videoPath(UUID)).toBe(`/${UUID}/video/`)
  })

  it('rejects malformed uuids', () => {
    expect(() => videoPath('not-a-uuid')).toThrow(TypeError)
  })
})

import { describe, expect, it } from 'vitest'

import { documentPath, dpi, format, page, quality } from './index'

const UUID = 'c2499162-eb07-4b93-b31e-94a89a47e858'

describe('document conversion', () => {
  it('format accepts documented targets', () => {
    expect(format('pdf')).toEqual({ name: 'format', params: ['pdf'] })
    expect(format('docx')).toEqual({ name: 'format', params: ['docx'] })
    expect(format('png')).toEqual({ name: 'format', params: ['png'] })
  })

  it('page builds a 1-based page selector', () => {
    expect(page(3)).toEqual({ name: 'page', params: ['3'] })
    expect(() => page(0)).toThrow(RangeError)
  })

  it('dpi and quality take the documented values for jpg output', () => {
    expect(dpi(300)).toEqual({ name: 'dpi', params: ['300'] })
    expect(quality(80)).toEqual({ name: 'quality', params: ['80'] })
    expect(documentPath(UUID, [format('jpg'), dpi(150), quality(90)])).toBe(
      `/${UUID}/document/-/format/jpg/-/dpi/150/-/quality/90/`
    )
    // @ts-expect-error not a documented dpi
    expect(() => dpi(100)).toThrow(RangeError)
    // @ts-expect-error quality goes in steps of 10
    expect(() => quality(85)).toThrow(RangeError)
  })

  it('documentPath builds a domain-less conversion path for the REST convert API', () => {
    expect(documentPath(UUID, [format('pdf')])).toBe(
      `/${UUID}/document/-/format/pdf/`
    )
  })

  it('documentPath with page selection for image targets', () => {
    expect(documentPath(UUID, [format('jpg'), page(2)])).toBe(
      `/${UUID}/document/-/format/jpg/-/page/2/`
    )
  })

  it('rejects malformed uuids', () => {
    expect(() => documentPath('nope')).toThrow(TypeError)
  })
})

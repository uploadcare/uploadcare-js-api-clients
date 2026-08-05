import { describe, expect, it } from '@jest/globals'
import { toSearchBody } from './toSearchBody'

describe('toSearchBody', () => {
  it('should send nothing for empty options', () => {
    expect(toSearchBody({})).toEqual({})
  })

  it('should keep query and fuzziness as they are', () => {
    expect(toSearchBody({ query: 'invoice', fuzziness: true })).toEqual({
      query: 'invoice',
      fuzziness: true
    })
  })

  it('should map isImage to is_image, including false', () => {
    expect(toSearchBody({ isImage: false })).toEqual({ is_image: false })
  })

  it('should map phrase fields to their api keys', () => {
    expect(
      toSearchBody({
        phrase: {
          originalFilename: 'invoice',
          detectedMimeType: 'image',
          metadata: 'red'
        }
      })
    ).toEqual({
      phrase: {
        original_filename: 'invoice',
        detected_mime_type: 'image',
        metadata: 'red'
      }
    })
  })

  it('should map exact fields and flatten metadata into metadata[key] siblings', () => {
    expect(
      toSearchBody({
        exact: {
          uuid: ['d8cb0d0b-7820-448a-804f-0770ca1894e7'],
          detectedMimeType: ['image/png'],
          originalFilename: ['logo.png'],
          metadata: { color: ['red', 'blue'], sku: ['A1'] }
        }
      })
    ).toEqual({
      exact: {
        uuid: ['d8cb0d0b-7820-448a-804f-0770ca1894e7'],
        detected_mime_type: ['image/png'],
        original_filename: ['logo.png'],
        'metadata[color]': ['red', 'blue'],
        'metadata[sku]': ['A1']
      }
    })
  })

  it('should copy metadata keys verbatim, without camelizing or decamelizing them', () => {
    expect(
      toSearchBody({ exact: { metadata: { my_key: ['a'], myKey: ['b'] } } })
    ).toEqual({
      exact: { 'metadata[my_key]': ['a'], 'metadata[myKey]': ['b'] }
    })
  })

  it('should turn dates in datetimeUploaded bounds into iso strings', () => {
    expect(
      toSearchBody({
        datetimeUploaded: {
          gte: new Date('2026-01-01T00:00:00.000Z'),
          lt: '2026-07-01T00:00:00.000Z'
        }
      })
    ).toEqual({
      datetime_uploaded: {
        gte: '2026-01-01T00:00:00.000Z',
        lt: '2026-07-01T00:00:00.000Z'
      }
    })
  })

  it('should pass size bounds through as numbers', () => {
    expect(toSearchBody({ size: { gt: 1000000, lte: 5000000 } })).toEqual({
      size: { gt: 1000000, lte: 5000000 }
    })
  })

  it('should pass tags groups through', () => {
    expect(
      toSearchBody({ tags: { all: ['cat', 'animal'], none: ['draft'] } })
    ).toEqual({ tags: { all: ['cat', 'animal'], none: ['draft'] } })
  })

  it('should turn sort entries into tokens, in order, prefixing descending ones', () => {
    expect(
      toSearchBody({
        sort: [
          { field: 'datetimeUploaded', order: 'desc' },
          { field: 'size' },
          { field: 'originalFilename', order: 'asc' },
          { field: 'score', order: 'desc' }
        ]
      })
    ).toEqual({
      sort: ['-datetime_uploaded', 'size', 'original_filename', '-score']
    })
  })

  it('should omit keys whose option is undefined rather than sending null', () => {
    const body = toSearchBody({
      query: 'invoice',
      isImage: undefined,
      tags: undefined,
      exact: { detectedMimeType: ['image/png'], originalFilename: undefined }
    })

    expect(body).toEqual({
      query: 'invoice',
      exact: { detected_mime_type: ['image/png'] }
    })
    expect(Object.keys(body)).not.toContain('is_image')
    expect(Object.keys(body.exact as object)).not.toContain('original_filename')
  })

  it('should never put limit, offset or include in the body', () => {
    expect(
      toSearchBody({
        query: 'invoice',
        limit: 50,
        offset: 100,
        include: 'appdata'
      })
    ).toEqual({ query: 'invoice' })
  })

  it('should map the combined tags + isImage + sort query', () => {
    expect(
      toSearchBody({
        tags: { all: ['cat', 'animal'], none: ['draft'] },
        isImage: true,
        sort: [{ field: 'datetimeUploaded', order: 'desc' }, { field: 'size' }],
        limit: 50
      })
    ).toEqual({
      tags: { all: ['cat', 'animal'], none: ['draft'] },
      is_image: true,
      sort: ['-datetime_uploaded', 'size']
    })
  })
})

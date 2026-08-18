import { describe, expect, it } from '@jest/globals'
import type { SearchFilesOptions, SearchFilesSortField } from './searchFiles'
import { toSearchBody } from './toSearchBody'

const BOUNDS = ['gt', 'gte', 'lt', 'lte'] as const

const SORT_TOKENS: [SearchFilesSortField, string][] = [
  ['score', 'score'],
  ['datetimeUploaded', 'datetime_uploaded'],
  ['size', 'size'],
  ['originalFilename', 'original_filename']
]

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

  it('should keep fuzziness false rather than dropping it', () => {
    expect(toSearchBody({ fuzziness: false })).toEqual({ fuzziness: false })
  })

  it('should map isImage to is_image, including false', () => {
    expect(toSearchBody({ isImage: true })).toEqual({ is_image: true })
    expect(toSearchBody({ isImage: false })).toEqual({ is_image: false })
  })

  describe('phrase', () => {
    it('should map every field to its api key', () => {
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

    it.each([
      [{ originalFilename: 'invoice' }, { original_filename: 'invoice' }],
      [{ detectedMimeType: 'image' }, { detected_mime_type: 'image' }],
      [{ metadata: 'red' }, { metadata: 'red' }]
    ])('should send %s on its own', (phrase, expected) => {
      expect(toSearchBody({ phrase })).toEqual({ phrase: expected })
    })
  })

  describe('exact', () => {
    it('should map every field and flatten metadata into metadata[key] siblings', () => {
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

    it('should keep several candidate values per field', () => {
      expect(
        toSearchBody({
          exact: { detectedMimeType: ['image/png', 'image/webp', 'image/avif'] }
        })
      ).toEqual({
        exact: {
          detected_mime_type: ['image/png', 'image/webp', 'image/avif']
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

    it('should send an empty exact object as one, letting the api reject it', () => {
      expect(toSearchBody({ exact: {} })).toEqual({ exact: {} })
      expect(toSearchBody({ exact: { metadata: {} } })).toEqual({ exact: {} })
    })
  })

  describe('ranges', () => {
    it.each(BOUNDS)('should send size.%s on its own', (bound) => {
      expect(toSearchBody({ size: { [bound]: 1000 } })).toEqual({
        size: { [bound]: 1000 }
      })
    })

    it.each(BOUNDS)('should send datetimeUploaded.%s on its own', (bound) => {
      expect(
        toSearchBody({
          datetimeUploaded: { [bound]: new Date('2026-01-01T00:00:00.000Z') }
        })
      ).toEqual({ datetime_uploaded: { [bound]: '2026-01-01T00:00:00.000Z' } })
    })

    it('should combine bounds into one range', () => {
      expect(toSearchBody({ size: { gt: 1000, lte: 5000 } })).toEqual({
        size: { gt: 1000, lte: 5000 }
      })
    })

    it('should keep a zero bound rather than dropping it', () => {
      expect(toSearchBody({ size: { gte: 0 } })).toEqual({ size: { gte: 0 } })
    })

    it('should accept an iso string as well as a Date', () => {
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

    it('should send an empty range as one, letting the api reject it', () => {
      expect(toSearchBody({ size: {} })).toEqual({ size: {} })
    })
  })

  describe('tags', () => {
    it.each(['any', 'all', 'none'] as const)(
      'should pass the %s group through',
      (group) => {
        expect(toSearchBody({ tags: { [group]: ['cat'] } })).toEqual({
          tags: { [group]: ['cat'] }
        })
      }
    )

    it('should pass all three groups together', () => {
      expect(
        toSearchBody({
          tags: { any: ['cat'], all: ['animal', 'pet'], none: ['draft'] }
        })
      ).toEqual({
        tags: { any: ['cat'], all: ['animal', 'pet'], none: ['draft'] }
      })
    })

    it('should keep an empty tag list, since the api has an opinion about it', () => {
      expect(toSearchBody({ tags: { all: [] } })).toEqual({ tags: { all: [] } })
    })
  })

  describe('sort', () => {
    it.each(SORT_TOKENS)(
      'should turn %s into its api token, ascending and descending',
      (field, token) => {
        expect(toSearchBody({ sort: [{ field }] })).toEqual({ sort: [token] })
        expect(toSearchBody({ sort: [{ field, order: 'asc' }] })).toEqual({
          sort: [token]
        })
        expect(toSearchBody({ sort: [{ field, order: 'desc' }] })).toEqual({
          sort: [`-${token}`]
        })
      }
    )

    it('should keep the order the caller gave, which is the sort priority', () => {
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

    it('should send an empty sort list as one', () => {
      expect(toSearchBody({ sort: [] })).toEqual({ sort: [] })
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

  it.each(['limit', 'offset', 'include'] as const)(
    'should never put %s in the body',
    (key) => {
      const body = toSearchBody({
        query: 'invoice',
        [key]: key === 'include' ? 'appdata' : 10
      } as SearchFilesOptions)

      expect(body).toEqual({ query: 'invoice' })
    }
  )

  it('should map every condition at once', () => {
    expect(
      toSearchBody({
        query: 'invoice',
        phrase: { originalFilename: 'receipt' },
        exact: { uuid: ['d8cb0d0b-7820-448a-804f-0770ca1894e7'] },
        datetimeUploaded: { gte: new Date('2026-01-01T00:00:00.000Z') },
        size: { gt: 1000 },
        isImage: true,
        fuzziness: true,
        tags: { all: ['cat', 'animal'], none: ['draft'] },
        sort: [{ field: 'datetimeUploaded', order: 'desc' }, { field: 'size' }],
        limit: 50,
        offset: 100,
        include: 'appdata'
      })
    ).toEqual({
      query: 'invoice',
      phrase: { original_filename: 'receipt' },
      exact: { uuid: ['d8cb0d0b-7820-448a-804f-0770ca1894e7'] },
      datetime_uploaded: { gte: '2026-01-01T00:00:00.000Z' },
      size: { gt: 1000 },
      is_image: true,
      fuzziness: true,
      tags: { all: ['cat', 'animal'], none: ['draft'] },
      sort: ['-datetime_uploaded', 'size']
    })
  })
})

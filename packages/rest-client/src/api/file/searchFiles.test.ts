import { describe, expect, it } from '@jest/globals'
import { Paginator } from '../../tools/paginate'
import { RestClientValidationError } from '../../tools/RestClientValidationError'
import { searchFiles, SearchFilesOptions } from './searchFiles'

import { testSettings } from '../../../test/helpers'

/**
 * Assertions about matches are about shape, not about which files come back:
 * search indexes newly uploaded files asynchronously and the test project's
 * contents are not fixed, so asserting on results would flake for reasons
 * unrelated to this code. The rejections below are exact, since they depend on
 * the request alone.
 */
describe('searchFiles', () => {
  describe('conditions the api accepts', () => {
    const accepted: { name: string; options: SearchFilesOptions }[] = [
      { name: 'query', options: { query: 'jpeg' } },
      {
        name: 'phrase on the filename',
        options: { phrase: { originalFilename: 'jpeg' } }
      },
      {
        name: 'phrase on the mime type',
        options: { phrase: { detectedMimeType: 'image' } }
      },
      {
        name: 'phrase on metadata',
        options: { phrase: { metadata: 'uploader' } }
      },
      { name: 'fuzziness', options: { query: 'jpeg', fuzziness: true } },
      {
        name: 'exact uuid',
        options: { exact: { uuid: ['8c8d781b-a19d-4b7d-bc79-a808ba71fe30'] } }
      },
      {
        name: 'exact mime type',
        options: { exact: { detectedMimeType: ['image/jpeg'] } }
      },
      {
        name: 'exact filename',
        options: { exact: { originalFilename: ['nope.jpeg'] } }
      },
      {
        name: 'exact metadata',
        options: { exact: { metadata: { subsystem: ['uploader'] } } }
      },
      { name: 'isImage true', options: { isImage: true } },
      { name: 'isImage false', options: { isImage: false } },
      { name: 'size lower bound', options: { size: { gt: 0 } } },
      { name: 'size range', options: { size: { gte: 1, lte: 100_000_000 } } },
      {
        name: 'datetimeUploaded from a Date',
        options: {
          datetimeUploaded: { gte: new Date('2000-01-01T00:00:00.000Z') }
        }
      },
      {
        name: 'datetimeUploaded from a string',
        options: { datetimeUploaded: { lt: '2100-01-01T00:00:00.000Z' } }
      },
      { name: 'tags any', options: { tags: { any: ['cat', 'animal'] } } },
      { name: 'tags all', options: { tags: { all: ['cat'] } } },
      { name: 'tags none', options: { tags: { none: ['draft'] } } },
      {
        name: 'four sort keys',
        options: {
          isImage: true,
          sort: [
            { field: 'score', order: 'desc' },
            { field: 'datetimeUploaded' },
            { field: 'size', order: 'desc' },
            { field: 'originalFilename' }
          ]
        }
      },
      {
        name: 'every condition at once',
        options: {
          query: 'jpeg',
          exact: { detectedMimeType: ['image/jpeg'] },
          datetimeUploaded: { gte: new Date('2000-01-01T00:00:00.000Z') },
          size: { gt: 0 },
          isImage: true,
          fuzziness: true,
          tags: { none: ['draft'] },
          sort: [{ field: 'datetimeUploaded', order: 'desc' }],
          include: 'appdata'
        }
      }
    ]

    it.each(accepted)('should search by $name', async ({ options }) => {
      const response = await searchFiles({ ...options, limit: 2 }, testSettings)

      expect(typeof response.total).toBe('number')
      expect(Array.isArray(response.results)).toBe(true)
      expect(response.results.length).toBeLessThanOrEqual(2)
      for (const file of response.results) {
        expect(file.uuid).toBeTruthy()
      }
    })
  })

  describe('the page it returns', () => {
    it('should report perPage as the limit asked for', async () => {
      const response = await searchFiles(
        { size: { gt: 0 }, limit: 3 },
        testSettings
      )

      expect(response.perPage).toBe(3)
      expect(response.results.length).toBeLessThanOrEqual(3)
      expect(response.previous).toBeNull()
    })

    it('should link to a next page while one remains', async () => {
      const response = await searchFiles(
        { size: { gt: 0 }, limit: 1 },
        testSettings
      )

      if (response.total > 1) {
        expect(response.next).toContain('/files/search/')
      }
    })

    // Sorted on purpose: relevance order is not stable between pages, so an
    // unsorted walk can hand back a file it already gave you.
    it('should walk to a second page of different files', async () => {
      const paginator = new Paginator(
        searchFiles,
        {
          size: { gt: 0 },
          limit: 1,
          sort: [{ field: 'datetimeUploaded', order: 'desc' }]
        },
        testSettings
      )

      const firstPage = await paginator.next()
      expect(firstPage?.results.length).toBeLessThanOrEqual(1)

      if (firstPage?.next) {
        const secondPage = await paginator.next()
        expect(secondPage?.results[0]?.uuid).not.toBe(
          firstPage.results[0]?.uuid
        )
        expect(secondPage?.previous).toBeTruthy()
      }
    })

    it('should carry appdata when asked to', async () => {
      const response = await searchFiles(
        { query: 'jpeg', include: 'appdata', limit: 1 },
        testSettings
      )

      for (const file of response.results) {
        expect(file).toHaveProperty('appdata')
      }
    })

    it('should highlight the field a full-text condition matched', async () => {
      const response = await searchFiles(
        { phrase: { originalFilename: 'jpeg' }, limit: 1 },
        testSettings
      )

      for (const file of response.results) {
        expect(file.highlight?.originalFilename?.[0]).toContain('<em>')
      }
    })

    it('should return an empty highlight when no full-text condition matched', async () => {
      const response = await searchFiles(
        { size: { gt: 0 }, limit: 1 },
        testSettings
      )

      for (const file of response.results) {
        expect(Object.keys(file.highlight ?? {})).toEqual([])
      }
    })
  })

  /**
   * Every rejection the endpoint documents, plus the ones its serializer adds.
   * Each names the field it blames, camelized apart from a metadata key.
   */
  describe('conditions the api rejects', () => {
    const rejected: {
      name: string
      options: SearchFilesOptions
      /** The key the client reports it under, read literally. */
      field: string
    }[] = [
      { name: 'no condition at all', options: {}, field: 'nonFieldErrors' },
      {
        name: 'a query under 4 characters',
        options: { query: 'abc' },
        field: 'query'
      },
      {
        name: 'a phrase under 4 characters',
        options: { phrase: { originalFilename: 'abc' } },
        field: 'phrase.originalFilename'
      },
      {
        name: 'the same field in phrase and exact',
        options: {
          phrase: { originalFilename: 'invoice' },
          exact: { originalFilename: ['invoice.pdf'] }
        },
        field: 'nonFieldErrors'
      },
      { name: 'an empty tags object', options: { tags: {} }, field: 'tags' },
      { name: 'a range with no bound', options: { size: {} }, field: 'size' },
      {
        name: 'a range that is not an object',
        options: { size: 5 as unknown as { gt: number } },
        field: 'size'
      },
      {
        name: 'isImage that is not a boolean',
        options: { isImage: 'yes' as unknown as boolean },
        field: 'isImage'
      },
      {
        name: 'a duplicate sort key',
        options: {
          isImage: true,
          sort: [{ field: 'size' }, { field: 'size' }]
        },
        field: 'sort'
      },
      {
        name: 'more than four sort keys',
        options: {
          isImage: true,
          sort: [
            { field: 'size' },
            { field: 'score' },
            { field: 'datetimeUploaded' },
            { field: 'originalFilename' },
            { field: 'size', order: 'desc' }
          ]
        },
        field: 'sort'
      },
      {
        name: 'an unknown sort key',
        options: { isImage: true, sort: [{ field: 'nope' as never }] },
        field: 'sort.0'
      },
      {
        name: 'a limit below 1',
        options: { isImage: true, limit: 0 },
        field: 'limit'
      },
      {
        name: 'a limit above 100',
        options: { isImage: true, limit: 101 },
        field: 'limit'
      },
      {
        name: 'offset plus limit over 1000',
        options: { isImage: true, limit: 100, offset: 950 },
        field: 'offset'
      }
    ]

    it.each(rejected)(
      'should reject $name, blaming $field',
      async ({ options, field }) => {
        expect.assertions(4)
        try {
          await searchFiles(options, testSettings)
        } catch (error) {
          const validationError = error as RestClientValidationError
          expect(validationError).toBeInstanceOf(RestClientValidationError)
          expect(validationError.status).toBe(400)
          // a literal key, so `toHaveProperty` would read the dot as a path
          expect(Object.keys(validationError.errors)).toContain(field)
          // the message is built from the same object, so it repeats the text
          expect(validationError.message).toContain(
            validationError.errors[field]?.[0]
          )
        }
      }
    )

    it('should name the field in the message, not only in errors', async () => {
      expect.assertions(2)
      try {
        await searchFiles({ query: 'abc' }, testSettings)
      } catch (error) {
        const validationError = error as RestClientValidationError
        expect(validationError.message).toBe(
          '[400 Bad Request] query: Must be at least 4 characters.'
        )
        expect(validationError.errors).toEqual({
          query: ['Must be at least 4 characters.']
        })
      }
    })

    it('should report a missing condition without a field prefix', async () => {
      expect.assertions(1)
      try {
        await searchFiles({}, testSettings)
      } catch (error) {
        expect((error as RestClientValidationError).message).toBe(
          '[400 Bad Request] At least one search criterion must be specified.'
        )
      }
    })
  })
})

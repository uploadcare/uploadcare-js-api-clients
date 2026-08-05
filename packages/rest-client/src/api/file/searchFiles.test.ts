import { describe, expect, it } from '@jest/globals'
import { Paginator } from '../../tools/paginate'
import { RestClientValidationError } from '../../tools/RestClientValidationError'
import { searchFiles } from './searchFiles'

import { testSettings } from '../../../test/helpers'

/**
 * Assertions are about shape, not about which files come back: search indexes
 * newly uploaded files asynchronously, and the test project's contents are not
 * fixed, so asserting on results would flake for reasons unrelated to this
 * code.
 */
describe('searchFiles', () => {
  it('should return a paginated list for a full-text query', async () => {
    const response = await searchFiles({ query: 'jpeg' }, testSettings)

    expect(typeof response.total).toBe('number')
    expect(Array.isArray(response.results)).toBe(true)
    expect(typeof response.perPage).toBe('number')
  })

  it('should accept a combined tags, isImage and sort query', async () => {
    const response = await searchFiles(
      {
        tags: { any: ['cat', 'animal'] },
        isImage: true,
        sort: [{ field: 'datetimeUploaded', order: 'desc' }, { field: 'size' }],
        limit: 5
      },
      testSettings
    )

    expect(typeof response.total).toBe('number')
    for (const file of response.results) {
      expect(file.uuid).toBeTruthy()
      expect(file.isImage).toBe(true)
    }
  })

  it('should accept exact conditions, including metadata keys', async () => {
    const response = await searchFiles(
      {
        exact: {
          detectedMimeType: ['image/jpeg'],
          metadata: { subsystem: ['uploader'] }
        },
        limit: 1
      },
      testSettings
    )

    expect(Array.isArray(response.results)).toBe(true)
  })

  it('should accept date and size ranges', async () => {
    const response = await searchFiles(
      {
        datetimeUploaded: { gte: new Date('2000-01-01T00:00:00.000Z') },
        size: { gt: 0 },
        limit: 1
      },
      testSettings
    )

    expect(typeof response.total).toBe('number')
  })

  it('should embed appdata when asked to', async () => {
    const response = await searchFiles(
      { query: 'jpeg', include: 'appdata', limit: 1 },
      testSettings
    )

    for (const file of response.results) {
      expect(file).toHaveProperty('appdata')
    }
  })

  it('should paginate through the Paginator', async () => {
    const paginator = new Paginator(
      searchFiles,
      { size: { gt: 0 }, limit: 1 },
      testSettings
    )

    const firstPage = await paginator.next()
    expect(firstPage?.results.length).toBeLessThanOrEqual(1)

    if (firstPage?.next) {
      const secondPage = await paginator.next()
      expect(secondPage?.results[0]?.uuid).not.toBe(firstPage.results[0]?.uuid)
    }
  })

  it('should reject with the offending field named when a condition is malformed', async () => {
    expect.assertions(4)
    try {
      await searchFiles({ size: 5 as unknown as { gt: number } }, testSettings)
    } catch (error) {
      const restClientError = error as RestClientValidationError
      expect(restClientError).toBeInstanceOf(RestClientValidationError)
      expect(restClientError.status).toBe(400)
      expect(restClientError.message).toContain('size')
      expect(restClientError.errors).toHaveProperty('size')
    }
  })

  it('should reject when no condition is given at all', async () => {
    expect.assertions(3)
    try {
      await searchFiles({}, testSettings)
    } catch (error) {
      const restClientError = error as RestClientValidationError
      expect(restClientError).toBeInstanceOf(RestClientValidationError)
      expect(restClientError.status).toBe(400)
      expect(restClientError.errors).toHaveProperty('nonFieldErrors')
    }
  })
})

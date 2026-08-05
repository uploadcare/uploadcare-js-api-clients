import { Metadata, Tags } from '@uploadcare/api-client-utils'
import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { FileInfo } from '../../types/FileInfo'
import { PaginatedList } from '../../types/PaginatedList'
import { handleApiRequest } from '../handleApiRequest'
import { toSearchBody } from './toSearchBody'

/** Bounds for a range condition. The API requires at least one of them. */
export type SearchFilesRange<T> = {
  gt?: T
  gte?: T
  lt?: T
  lte?: T
}

/** Candidate values per metadata key, sent as `metadata[key]`. */
export type SearchFilesExactMetadata = {
  [K in keyof Metadata]?: Metadata[K][]
}

/** Exact matching. A file matches a field if it equals any of its values. */
export type SearchFilesExact = {
  uuid?: string[]
  detectedMimeType?: string[]
  originalFilename?: string[]
  metadata?: SearchFilesExactMetadata
}

/**
 * Full-text matching per field, each phrase at least 4 characters. A field used
 * here cannot also appear in {@link SearchFilesExact}.
 */
export type SearchFilesPhrase = {
  originalFilename?: string
  detectedMimeType?: string
  /** One phrase, matched across metadata values. */
  metadata?: string
}

/** Tag filters. Tags are lowercased and whitespace-stripped server-side. */
export type SearchFilesTags = {
  /** Has at least one of these tags. */
  any?: Tags
  /** Has all of these tags. */
  all?: Tags
  /** Has none of these tags. */
  none?: Tags
}

export type SearchFilesSortField =
  | 'score'
  | 'datetime_uploaded'
  | 'size'
  | 'original_filename'

export type SearchFilesSort = {
  field: SearchFilesSortField
  /** Defaults to `'asc'`. */
  order?: 'asc' | 'desc'
}

/**
 * At least one condition is required — `query`, `phrase`, `exact`,
 * `datetimeUploaded`, `size`, `isImage` or `tags`. Conditions combine with
 * AND.
 */
export type SearchFilesOptions = {
  /** Full-text across searchable fields, at least 4 characters. */
  query?: string
  phrase?: SearchFilesPhrase
  exact?: SearchFilesExact
  datetimeUploaded?: SearchFilesRange<Date | string>
  /** File size in bytes. */
  size?: SearchFilesRange<number>
  /** `false` excludes images. */
  isImage?: boolean
  /** Typo tolerance for `query` and `phrase`. Slower. Defaults to `false`. */
  fuzziness?: boolean
  tags?: SearchFilesTags
  /** Up to 4 keys, applied in the order given. Defaults to relevance. */
  sort?: SearchFilesSort[]
  /** 1–100, defaults to 20. */
  limit?: number
  /** `offset + limit` must stay under 1000. */
  offset?: number
  include?: 'appdata'
}

/**
 * Matched tokens, wrapped in `<em>`, for fields that matched a full-text
 * condition.
 */
export type SearchFilesHighlight = {
  originalFilename?: string[]
  detectedMimeType?: string[]
  /** Matched tokens per metadata key. */
  metadata?: Metadata
}

export type SearchFilesResult = FileInfo & {
  highlight?: SearchFilesHighlight
}

export type SearchFilesResponse = PaginatedList<SearchFilesResult>

/**
 * Searches the project's files. Paginates through `limit` and `offset`, so it
 * works with {@link paginate} and `Paginator`, up to the API's ceiling of
 * `offset + limit < 1000`.
 *
 * Newly uploaded files are indexed asynchronously and may not be found straight
 * away.
 *
 * @example
 *   ;```ts
 *   const page = await searchFiles(
 *     {
 *       tags: { all: ['cat', 'animal'] },
 *       isImage: true,
 *       sort: [{ field: 'datetime_uploaded', order: 'desc' }]
 *     },
 *     { authSchema }
 *   )
 *   ```
 *
 * @see https://uploadcare.com/docs/api/rest/file/search-files/
 */
export async function searchFiles(
  options: SearchFilesOptions,
  userSettings: ApiRequestSettings
): Promise<SearchFilesResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'POST',
      path: '/files/search/',
      query: {
        limit: options.limit,
        offset: options.offset,
        include: options.include
      },
      body: toSearchBody(options)
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}

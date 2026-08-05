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

/** Sort keys the API accepts, spelled as this client spells them. */
export type SearchFilesSortField =
  | 'score'
  | 'datetimeUploaded'
  | 'size'
  | 'originalFilename'

/** One sort key. Several are applied in the order given. */
export type SearchFilesSort = {
  field: SearchFilesSortField
  /** Defaults to `'asc'`. */
  order?: 'asc' | 'desc'
}

/**
 * At least one condition is required: `query`, `phrase`, `exact`,
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
  /**
   * Up to 4 keys, applied in the order given. Defaults to relevance, which is
   * not stable between pages: give an explicit sort when paginating, or a page
   * can repeat a file an earlier one already returned.
   */
  sort?: SearchFilesSort[]
  /** 1 to 100, defaults to 20. */
  limit?: number
  /** `offset + limit` must stay under 1000. */
  offset?: number
  include?: 'appdata'
}

/**
 * Matched tokens, wrapped in `<em>`, for fields that matched a full-text
 * condition. Field names arrive camelized like the rest of a response, while
 * the keys inside `metadata` are yours and are left alone.
 */
export type SearchFilesHighlight = {
  originalFilename?: string[]
  detectedMimeType?: string[]
  /** Matched tokens per metadata key. */
  metadata?: Metadata
}

/** A file as search returns it: the usual fields, plus what matched. */
export type SearchFilesResult = FileInfo & {
  highlight?: SearchFilesHighlight
}

/**
 * One page of results. Satisfies {@link Paginatable}, so {@link paginate} and
 * {@link Paginator} accept {@link searchFiles}.
 */
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
 *   const page = await searchFiles(
 *     {
 *       tags: { all: ['cat', 'animal'] },
 *       isImage: true,
 *       sort: [{ field: 'datetimeUploaded', order: 'desc' }]
 *     },
 *     { authSchema }
 *   )
 *
 * @param options - Search conditions, and `limit`/`offset`/`include`. At least
 *   one condition is required.
 * @param userSettings - Auth schema and any request settings.
 * @returns One page of matching files, newest-first by relevance unless `sort`
 *   says otherwise.
 * @throws {@link RestClientValidationError} When a condition is malformed or
 *   none is given; its `errors` name the fields.
 * @see https://uploadcare.com/docs/file-search/
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

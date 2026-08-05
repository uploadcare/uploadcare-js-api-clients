import type {
  SearchFilesExact,
  SearchFilesOptions,
  SearchFilesPhrase,
  SearchFilesRange,
  SearchFilesSort,
  SearchFilesSortField
} from './searchFiles'

/** The API's own sort tokens, which callers never have to spell. */
const SORT_FIELDS: Record<SearchFilesSortField, string> = {
  score: 'score',
  datetimeUploaded: 'datetime_uploaded',
  size: 'size',
  originalFilename: 'original_filename'
}

/** Drops keys the caller left out, so a present key always means a condition. */
const defined = <Value>(
  source: Record<string, Value | undefined>
): Record<string, Value> =>
  Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined)
  ) as Record<string, Value>

const toSortTokens = (sort: SearchFilesSort[]): string[] =>
  sort.map(
    ({ field, order }) => `${order === 'desc' ? '-' : ''}${SORT_FIELDS[field]}`
  )

const toIsoBounds = (
  range: SearchFilesRange<Date | string>
): SearchFilesRange<string> =>
  Object.fromEntries(
    Object.entries(defined(range)).map(([bound, value]) => [
      bound,
      value instanceof Date ? value.toISOString() : value
    ])
  )

/**
 * The API has no nested metadata object: it addresses one metadata key with a
 * literal `metadata[key]` key of `exact` itself. The caller's metadata keys are
 * copied into the brackets verbatim — only the fixed field names are
 * rewritten.
 */
const toExact = ({
  uuid,
  detectedMimeType,
  originalFilename,
  metadata
}: SearchFilesExact): Record<string, string[]> =>
  defined({
    uuid,
    detected_mime_type: detectedMimeType,
    original_filename: originalFilename,
    ...Object.fromEntries(
      Object.entries(metadata ?? {}).map(([key, values]) => [
        `metadata[${key}]`,
        values
      ])
    )
  })

const toPhrase = ({
  originalFilename,
  detectedMimeType,
  metadata
}: SearchFilesPhrase): Record<string, string> =>
  defined({
    original_filename: originalFilename,
    detected_mime_type: detectedMimeType,
    metadata
  })

/**
 * Builds the `POST /files/search/` request body from the options.
 *
 * `makeApiRequest` sends bodies verbatim, so the API's own key names are
 * written here. `limit`, `offset` and `include` are query params and never
 * appear in the body.
 */
export const toSearchBody = (
  options: SearchFilesOptions
): Record<string, unknown> =>
  defined({
    query: options.query,
    phrase: options.phrase && toPhrase(options.phrase),
    exact: options.exact && toExact(options.exact),
    datetime_uploaded:
      options.datetimeUploaded && toIsoBounds(options.datetimeUploaded),
    size: options.size && defined(options.size),
    is_image: options.isImage,
    fuzziness: options.fuzziness,
    tags: options.tags && defined(options.tags),
    sort: options.sort && toSortTokens(options.sort)
  })

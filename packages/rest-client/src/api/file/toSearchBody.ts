import type {
  SearchFilesExact,
  SearchFilesOptions,
  SearchFilesPhrase,
  SearchFilesRange,
  SearchFilesSort
} from './searchFiles'

/** Drops keys the caller left out, so a present key always means a condition. */
const defined = <Value>(
  source: Record<string, Value | undefined>
): Record<string, Value> =>
  Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined)
  ) as Record<string, Value>

/** `field` is already the API's own token, so only the direction is added. */
const toSortTokens = (sort: SearchFilesSort[]): string[] =>
  sort.map(({ field, order }) => `${order === 'desc' ? '-' : ''}${field}`)

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
 * Field names are already the API's own, so only `metadata` moves: the API has
 * no nested metadata object, it addresses one metadata key with a literal
 * `metadata[key]` key of `exact` itself. The caller's keys are copied into the
 * brackets verbatim.
 */
const toExact = ({
  metadata,
  ...fields
}: SearchFilesExact): Record<string, string[]> =>
  defined({
    ...fields,
    ...Object.fromEntries(
      Object.entries(metadata ?? {}).map(([key, values]) => [
        `metadata[${key}]`,
        values
      ])
    )
  })

/** Field names already match the API, so only absent ones are dropped. */
const toPhrase = (phrase: SearchFilesPhrase): Record<string, string> =>
  defined(phrase)

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

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'

/**
 * Formats a written file with this package's own `oxfmt`, so a freshly written
 * spec snapshot matches what `format:check` expects without a separate manual
 * step.
 */
export const formatWithOxfmt = (filePath: string): void => {
  execFileSync('npx', ['oxfmt', filePath], {
    cwd: path.join(import.meta.dirname, '..'),
    stdio: 'ignore'
  })
}

/** Where to get a fresh presigned link once the current one expires. */
export const SPEC_DOCS_PAGE = 'https://uploadcare.com/docs/api/upload/'

export type FetchedSpec = {
  /** The parsed OpenAPI document. */
  document: unknown
  /** `info.version` from the document. */
  version: string
  /** SHA-256 of the downloaded bytes, hex-encoded. */
  sha256: string
  /**
   * `url` with every `X-Amz-*` query parameter stripped — never commit a
   * signature.
   */
  strippedUrl: string
}

const stripSignature = (url: string) => {
  const parsed = new URL(url)
  // Collected first, then deleted: `delete` mutates the same collection, and a
  // live iterator skips the entry after each removal.
  const signatureKeys = Array.from(parsed.searchParams.keys()).filter((key) =>
    key.toLowerCase().startsWith('x-amz-')
  )
  for (const key of signatureKeys) parsed.searchParams.delete(key)
  return parsed.toString()
}

const expiredMessage = (detail: string) =>
  `${detail} The presigned URL has likely expired — get a fresh one from ` +
  `${SPEC_DOCS_PAGE} ("Download OpenAPI spec").`

/**
 * Downloads the Upload API's OpenAPI document from a presigned URL and parses
 * it. Used by both `spec:refresh` and `spec:check`, which differ only in what
 * they do with the result.
 */
export const fetchSpec = async (url: string): Promise<FetchedSpec> => {
  let response: Response
  try {
    response = await fetch(url)
  } catch (cause) {
    throw new Error(
      expiredMessage(`Could not reach ${url}: ${String(cause)}.`),
      { cause }
    )
  }
  if (!response.ok) {
    throw new Error(
      expiredMessage(`Download failed with HTTP ${response.status}.`)
    )
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  const text = new TextDecoder().decode(bytes)

  let document: unknown
  try {
    document = parseYaml(text)
  } catch (cause) {
    throw new Error(
      `Downloaded file is not valid YAML (${String(cause)}). Is this the right asset?`,
      { cause }
    )
  }

  const version = (document as { info?: { version?: unknown } } | null)?.info
    ?.version
  if (typeof version !== 'string') {
    throw new Error(
      'Downloaded document has no info.version — is this the right asset?'
    )
  }

  return {
    document,
    version,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    strippedUrl: stripSignature(url)
  }
}

export const requireUrlArg = (
  scriptName: 'spec:refresh' | 'spec:check',
  argv: string[]
): string => {
  const url = argv[2]
  if (!url) {
    console.error(
      `Usage: npm run ${scriptName} -- <presigned-url>\nGet a fresh link from ${SPEC_DOCS_PAGE} ("Download OpenAPI spec").`
    )
    process.exit(1)
  }
  return url
}

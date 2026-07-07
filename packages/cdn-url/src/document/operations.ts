/**
 * Document conversion operations.
 *
 * @see https://uploadcare.com/docs/transformations/document-conversion/
 */
import { assertOneOf } from '../grammar'
import { namedOp } from '../operation-ref'
import type { CdnOperation } from '../types'
import { createOp } from '../ops/create-op'

/** Target formats accepted by {@link format}. */
export const DOCUMENT_TARGETS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'odt',
  'ods',
  'rtf',
  'txt',
  'html',
  'pptx',
  'jpg',
  'png',
  'webp',
  'gif',
  'ico',
  'bmp',
  'tiff',
  'pcx',
  'ps',
  'svg',
  'tga',
  'wbmp',
  'avif',
  'thumbnail'
] as const
/** One of the {@link DOCUMENT_TARGETS} values. */
export type DocumentTarget = (typeof DOCUMENT_TARGETS)[number]

/**
 * Conversion target format (PDF when omitted from the path).
 *
 * @see https://uploadcare.com/docs/transformations/document-conversion/#process
 * @example
 * ```ts
 * format('pdf') // → -/format/pdf/
 * ```
 */
export const format = /* @__PURE__ */ namedOp(
  'format',
  function format(target: DocumentTarget): CdnOperation {
    assertOneOf(target, DOCUMENT_TARGETS, 'document format')
    return createOp('format', target)
  }
)

/**
 * 1-based page selector; only valid when the target format is `jpg`/`png`.
 *
 * @see https://uploadcare.com/docs/transformations/document-conversion/#process
 * @example
 * ```ts
 * page(2) // → -/page/2/
 * ```
 */
export const page = /* @__PURE__ */ namedOp(
  'page',
  function page(number: number): CdnOperation {
    if (__DEV__ && (!Number.isInteger(number) || number < 1)) {
      throw new RangeError(
        `document page must be a positive 1-based integer, got ${number}`
      )
    }
    return createOp('page', String(number))
  }
)

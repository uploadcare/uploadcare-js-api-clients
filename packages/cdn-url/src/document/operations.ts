/**
 * Document conversion operations.
 *
 * @see https://uploadcare.com/docs/transformations/document-conversion/
 */
import { assertOneOf } from '../grammar'
import { namedOp } from '../operation-ref'
import type { CdnOperation } from '../types'
import { rawOp } from '../ops/raw-op'

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
    return rawOp('format', target)
  }
)

function assertOneOfNumbers(
  value: number,
  allowed: readonly number[],
  label: string
): void {
  if (__DEV__ && !allowed.includes(value)) {
    throw new RangeError(
      `${label} must be one of ${allowed.join(', ')}; got ${value}`
    )
  }
}

/** DPI values accepted by {@link dpi}. */
export const DOCUMENT_DPI_VALUES = [72, 96, 150, 200, 250, 300, 600] as const
/** One of the {@link DOCUMENT_DPI_VALUES}. */
export type DocumentDpi = (typeof DOCUMENT_DPI_VALUES)[number]

/**
 * Resolution of `jpg` output, in dots per inch.
 *
 * @see https://uploadcare.com/docs/transformations/document-conversion/#process
 * @example
 * ```ts
 * dpi(300) // → -/dpi/300/
 * ```
 */
export const dpi = /* @__PURE__ */ namedOp(
  'dpi',
  function dpi(value: DocumentDpi): CdnOperation {
    assertOneOfNumbers(value, DOCUMENT_DPI_VALUES, 'document dpi')
    return rawOp('dpi', String(value))
  }
)

/** Quality levels accepted by {@link quality}: 10..100 in steps of 10. */
export const DOCUMENT_QUALITY_VALUES = [
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100
] as const
/** One of the {@link DOCUMENT_QUALITY_VALUES}. */
export type DocumentQuality = (typeof DOCUMENT_QUALITY_VALUES)[number]

/**
 * Quality of `jpg` output.
 *
 * @see https://uploadcare.com/docs/transformations/document-conversion/#process
 * @example
 * ```ts
 * quality(80) // → -/quality/80/
 * ```
 */
export const quality = /* @__PURE__ */ namedOp(
  'quality',
  function quality(value: DocumentQuality): CdnOperation {
    assertOneOfNumbers(value, DOCUMENT_QUALITY_VALUES, 'document quality')
    return rawOp('quality', String(value))
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
    return rawOp('page', String(number))
  }
)

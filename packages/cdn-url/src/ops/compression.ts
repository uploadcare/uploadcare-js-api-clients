/**
 * Compression and delivery operations.
 *
 * @see https://uploadcare.com/docs/compression/
 */
import { assertOneOf } from '../grammar'
import { namedOp } from '../operation-ref'
import type { CdnOperation } from '../types'
import { createOp } from './create-op'

/** Output formats accepted by {@link format}. */
export const FORMATS = ['jpeg', 'png', 'webp', 'auto', 'preserve'] as const
/** One of the {@link FORMATS} values. */
export type Format = (typeof FORMATS)[number]

/**
 * Output format. `auto` negotiates modern formats (WebP/AVIF) with the
 * client; `jpeg` also raises the output dimension ceiling to 5000px.
 *
 * @see https://uploadcare.com/docs/compression/#operation-format
 * @example
 * ```ts
 * format('auto') // → -/format/auto/
 * ```
 */
export const format = /* @__PURE__ */ namedOp(
  'format',
  function format(value: Format): CdnOperation {
    assertOneOf(value, FORMATS, 'format')
    return createOp('format', value)
  }
)

/** Quality presets accepted by {@link quality}. */
export const QUALITIES = [
  'normal',
  'better',
  'best',
  'lighter',
  'lightest',
  'smart',
  'smart_retina'
] as const
/** One of the {@link QUALITIES} presets. */
export type Quality = (typeof QUALITIES)[number]

/**
 * Compression quality preset; `smart`/`smart_retina` are content-aware.
 *
 * @see https://uploadcare.com/docs/compression/#operation-quality
 * @example
 * ```ts
 * quality('smart') // → -/quality/smart/
 * ```
 */
export const quality = /* @__PURE__ */ namedOp(
  'quality',
  function quality(value: Quality): CdnOperation {
    assertOneOf(value, QUALITIES, 'quality')
    return createOp('quality', value)
  }
)

/**
 * Progressive JPEG delivery (CDN default off).
 *
 * @see https://uploadcare.com/docs/compression/#operation-progressive
 * @example
 * ```ts
 * progressive(true) // → -/progressive/yes/
 * ```
 */
export const progressive = /* @__PURE__ */ namedOp(
  'progressive',
  function progressive(enabled: boolean): CdnOperation {
    return createOp('progressive', enabled ? 'yes' : 'no')
  }
)

/** Allowed {@link stripMeta} modes. */
export const STRIP_META_MODES = ['all', 'none', 'sensitive'] as const
/** One of the {@link STRIP_META_MODES} values. */
export type StripMetaMode = (typeof STRIP_META_MODES)[number]

/**
 * Controls which meta information survives in the output (CDN default `all`).
 *
 * @see https://uploadcare.com/docs/compression/#operation-strip-meta
 * @example
 * ```ts
 * stripMeta('sensitive') // → -/strip_meta/sensitive/
 * ```
 */
export const stripMeta = /* @__PURE__ */ namedOp(
  'strip_meta',
  function stripMeta(mode: StripMetaMode): CdnOperation {
    assertOneOf(mode, STRIP_META_MODES, 'strip_meta mode')
    return createOp('strip_meta', mode)
  }
)

/**
 * Content-Disposition override: show in the browser vs download.
 *
 * @see https://uploadcare.com/docs/cdn-operations/#operation-inline
 * @example
 * ```ts
 * inline(false) // → -/inline/no/
 * ```
 */
export const inline = /* @__PURE__ */ namedOp(
  'inline',
  function inline(enabled: boolean): CdnOperation {
    return createOp('inline', enabled ? 'yes' : 'no')
  }
)

/**
 * Rasterizes an SVG so the full set of raster operations applies.
 *
 * @see https://uploadcare.com/docs/transformations/image/svg/
 * @example
 * ```ts
 * rasterize() // → -/rasterize/
 * ```
 */
export const rasterize = /* @__PURE__ */ namedOp(
  'rasterize',
  function rasterize(): CdnOperation {
    return createOp('rasterize')
  }
)

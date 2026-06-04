/**
 * GIF to video conversion operations.
 *
 * @see https://uploadcare.com/docs/transformations/gif-to-video/
 */
import { assertOneOf } from '../grammar'
import { namedOp } from '../operation-ref'
import type { CdnOperation } from '../types'
import { createOp } from '../ops/create-op'

/** Output formats accepted by {@link format}. */
export const GIF2VIDEO_FORMATS = ['mp4', 'webm'] as const
/** One of the {@link GIF2VIDEO_FORMATS} values. */
export type Gif2VideoFormat = (typeof GIF2VIDEO_FORMATS)[number]

/**
 * Output format (CDN default `mp4`). Unlike full video conversion, `ogg`
 * is not available here.
 *
 * @see https://uploadcare.com/docs/transformations/gif-to-video/#operation-gif2video-format
 * @example
 * ```ts
 * format('webm') // → -/format/webm/
 * ```
 */
export const format = /* @__PURE__ */ namedOp(
  'format',
  function format(value: Gif2VideoFormat): CdnOperation {
    assertOneOf(value, GIF2VIDEO_FORMATS, 'gif2video format')
    return createOp('format', value)
  }
)

/**
 * Quality presets accepted by {@link quality}. Intentionally mirrors the
 * video conversion presets (no smart/smart_retina image presets here).
 */
export const GIF2VIDEO_QUALITIES = [
  'normal',
  'better',
  'best',
  'lighter',
  'lightest'
] as const
/** One of the {@link GIF2VIDEO_QUALITIES} presets. */
export type Gif2VideoQuality = (typeof GIF2VIDEO_QUALITIES)[number]

/**
 * Output quality preset (CDN default `normal`).
 *
 * @see https://uploadcare.com/docs/transformations/gif-to-video/#operation-gif2video-quality
 * @example
 * ```ts
 * quality('better') // → -/quality/better/
 * ```
 */
export const quality = /* @__PURE__ */ namedOp(
  'quality',
  function quality(value: Gif2VideoQuality): CdnOperation {
    assertOneOf(value, GIF2VIDEO_QUALITIES, 'gif2video quality')
    return createOp('quality', value)
  }
)

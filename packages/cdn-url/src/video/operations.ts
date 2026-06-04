/**
 * Video conversion operations.
 *
 * @see https://uploadcare.com/docs/transformations/video-encoding/
 */
import { assertIntInRange, assertOneOf } from '../grammar'
import { namedOp } from '../operation-ref'
import type { CdnOperation } from '../types'
import { createOp } from '../ops/create-op'

/** Resize modes accepted by {@link size}. */
export const VIDEO_RESIZE_MODES = [
  'preserve_ratio',
  'change_ratio',
  'scale_crop',
  'add_padding'
] as const
/** One of the {@link VIDEO_RESIZE_MODES} values. */
export type VideoResizeMode = (typeof VIDEO_RESIZE_MODES)[number]

/**
 * Output frame size; each dimension must be a positive integer divisible
 * by 4 (downscale only, output capped near 4K).
 *
 * @see https://uploadcare.com/docs/transformations/video-encoding/#operation-size
 * @example
 * ```ts
 * size({ width: 720, height: 540 }) // → -/size/720x540/
 * ```
 */
export const size = /* @__PURE__ */ namedOp(
  'size',
  function size(options: {
    width?: number
    height?: number
    mode?: VideoResizeMode
  }): CdnOperation {
    const { width, height, mode } = options
    if (__DEV__ && width == null && height == null) {
      throw new TypeError('video size requires at least one of width/height')
    }
    for (const [label, value] of [
      ['width', width],
      ['height', height]
    ] as const) {
      if (
        __DEV__ &&
        value != null &&
        (!Number.isInteger(value) || value <= 0 || value % 4 !== 0)
      ) {
        throw new RangeError(
          `video size ${label} must be a positive integer divisible by 4, got ${value}`
        )
      }
    }
    const dims = `${width ?? ''}x${height ?? ''}`
    if (mode == null) return createOp('size', dims)
    assertOneOf(mode, VIDEO_RESIZE_MODES, 'video resize mode')
    return createOp('size', dims, mode)
  }
)

/** Quality presets accepted by {@link quality}. */
export const VIDEO_QUALITIES = [
  'normal',
  'better',
  'best',
  'lighter',
  'lightest'
] as const
/** One of the {@link VIDEO_QUALITIES} presets. */
export type VideoQuality = (typeof VIDEO_QUALITIES)[number]

/**
 * Output quality preset (CDN default `normal`).
 *
 * @see https://uploadcare.com/docs/transformations/video-encoding/#operation-quality
 * @example
 * ```ts
 * quality('best') // → -/quality/best/
 * ```
 */
export const quality = /* @__PURE__ */ namedOp(
  'quality',
  function quality(value: VideoQuality): CdnOperation {
    assertOneOf(value, VIDEO_QUALITIES, 'video quality')
    return createOp('quality', value)
  }
)

/** Output formats accepted by {@link format}. */
export const VIDEO_FORMATS = ['mp4', 'webm', 'ogg'] as const
/** One of the {@link VIDEO_FORMATS} values. */
export type VideoFormat = (typeof VIDEO_FORMATS)[number]

/**
 * Output container/codec (CDN default `mp4`).
 *
 * @see https://uploadcare.com/docs/transformations/video-encoding/#operation-format
 * @example
 * ```ts
 * format('webm') // → -/format/webm/
 * ```
 */
export const format = /* @__PURE__ */ namedOp(
  'format',
  function format(value: VideoFormat): CdnOperation {
    assertOneOf(value, VIDEO_FORMATS, 'video format')
    return createOp('format', value)
  }
)

/** `HHH:MM:SS.sss`, `MM:SS.sss` or plain seconds `SSSS.sss`. */
const TIME_RE = /^(\d{1,3}:)?(\d{1,2}:)?\d{1,4}(\.\d+)?$/

/**
 * Cuts a fragment starting at `startTime`; `length` accepts a duration in
 * the same time format or the `end` keyword.
 *
 * @see https://uploadcare.com/docs/transformations/video-encoding/#operation-cut
 * @example
 * ```ts
 * cut('0:0:10.0', '30.0') // → -/cut/0:0:10.0/30.0/
 * ```
 */
export const cut = /* @__PURE__ */ namedOp(
  'cut',
  function cut(startTime: string, length: string): CdnOperation {
    if (__DEV__ && !TIME_RE.test(startTime)) {
      throw new RangeError(`Invalid cut start time: "${startTime}"`)
    }
    if (__DEV__ && length !== 'end' && !TIME_RE.test(length)) {
      throw new RangeError(`Invalid cut length: "${length}"`)
    }
    return createOp('cut', startTime, length)
  }
)

/**
 * Generates N thumbnails (1..50, CDN default 1); must be the **last**
 * operation in the chain.
 *
 * @see https://uploadcare.com/docs/transformations/video-encoding/#operation-thumbs
 * @example
 * ```ts
 * thumbs(20) // → -/thumbs~20/
 * ```
 */
export const thumbs = /* @__PURE__ */ namedOp(
  'thumbs',
  function thumbs(
    count: number,
    options: { fromFirstFrame?: boolean } = {}
  ): CdnOperation {
    assertIntInRange(count, 1, 50, 'thumbs count')
    return options.fromFirstFrame
      ? createOp(`thumbs~${count}`, 'yes')
      : createOp(`thumbs~${count}`)
  }
)

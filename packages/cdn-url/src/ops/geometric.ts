/**
 * Resize, crop and rotation operations.
 *
 * @see https://uploadcare.com/docs/transformations/image/resize-crop/
 */
import type { Alignment, SizeValue } from '../grammar'
import { namedOp } from '../operation-ref'
import {
  alignment,
  assertIntInRange,
  assertOneOf,
  color,
  dimensions,
  sizeValue
} from '../grammar'
import type { CdnOperation } from '../types'
import { createOp } from './create-op'

/**
 * Downscales an image proportionally to fit the given dimensions
 * (`2048x2048` when omitted). With no arguments it acts as the minimal
 * "process this image" core operation.
 *
 * @see https://uploadcare.com/docs/transformations/image/resize-crop/#operation-preview
 * @example
 * ```ts
 * preview() // → -/preview/
 * preview(1000, 400) // → -/preview/1000x400/
 * ```
 */
export const preview = /* @__PURE__ */ namedOp(
  'preview',
  function preview(width?: number, height?: number): CdnOperation {
    if (width == null && height == null) return createOp('preview')
    if (__DEV__ && (width == null || height == null)) {
      throw new TypeError('preview requires either no dimensions or both')
    }
    return createOp('preview', dimensions(width, height, 'preview'))
  }
)

/**
 * Resizes to exact dimensions; one side may be omitted to preserve the
 * aspect ratio. Providing both sides may distort the image.
 *
 * @see https://uploadcare.com/docs/transformations/image/resize-crop/#operation-resize
 * @example
 * ```ts
 * resize({ width: 320 }) // → -/resize/320x/
 * ```
 */
export const resize = /* @__PURE__ */ namedOp(
  'resize',
  function resize(dims: { width?: number; height?: number }): CdnOperation {
    return createOp('resize', dimensions(dims.width, dims.height, 'resize'))
  }
)

/**
 * Content-aware resize that generates missing parts. Both dimensions
 * required.
 *
 * @see https://uploadcare.com/docs/transformations/image/resize-crop/#operation-smart-resize
 * @example
 * ```ts
 * smartResize(440, 600) // → -/smart_resize/440x600/
 * ```
 */
export const smartResize = /* @__PURE__ */ namedOp(
  'smart_resize',
  function smartResize(width: number, height: number): CdnOperation {
    return createOp('smart_resize', dimensions(width, height, 'smart_resize'))
  }
)

/** Allowed {@link stretch} modes. */
export const STRETCH_MODES = ['on', 'off', 'fill'] as const
/** One of the {@link STRETCH_MODES} values. */
export type StretchMode = (typeof STRETCH_MODES)[number]

/**
 * Upscale behavior for the **following** resize/scale_crop operation —
 * ordering matters, and the pair may repeat.
 *
 * @see https://uploadcare.com/docs/transformations/image/resize-crop/#operation-stretch
 * @example
 * ```ts
 * stretch('off') // → -/stretch/off/ (applies to the following resize)
 * ```
 */
export const stretch = /* @__PURE__ */ namedOp(
  'stretch',
  function stretch(mode: StretchMode): CdnOperation {
    assertOneOf(mode, STRETCH_MODES, 'stretch mode')
    return createOp('stretch', mode)
  }
)

/**
 * Crops to the given size at an offset (CDN default `0,0`). Dimensions
 * accept percent values (`'50p'`); pixel offsets may be negative.
 *
 * @see https://uploadcare.com/docs/transformations/image/resize-crop/#operation-crop
 * @example
 * ```ts
 * crop(640, 480, 'center') // → -/crop/640x480/center/
 * ```
 */
export const crop = /* @__PURE__ */ namedOp(
  'crop',
  function crop(
    width: SizeValue,
    height: SizeValue,
    align?: Alignment
  ): CdnOperation {
    const dims = dimensions(width, height, 'crop')
    return align == null
      ? createOp('crop', dims)
      : createOp('crop', dims, alignment(align, 'crop alignment'))
  }
)

const RATIO_RE = /^[1-9]\d*:[1-9]\d*$/

/**
 * Crops to an aspect ratio, e.g. `'16:9'` (CDN default alignment `center`).
 *
 * @see https://uploadcare.com/docs/transformations/image/resize-crop/#operation-crop-by-ratio
 * @example
 * ```ts
 * cropByRatio('16:9') // → -/crop/16:9/
 * ```
 */
export const cropByRatio = /* @__PURE__ */ namedOp(
  'crop',
  function cropByRatio(ratio: string, align?: Alignment): CdnOperation {
    if (__DEV__ && !RATIO_RE.test(ratio)) {
      throw new RangeError(`Invalid crop ratio: "${ratio}" (expected "N:M")`)
    }
    return align == null
      ? createOp('crop', ratio)
      : createOp('crop', ratio, alignment(align, 'crop alignment'))
  }
)

/** Object tags recognized by {@link cropByTag}. */
export type CropTag = 'face' | 'image'

/**
 * Object-aware crop around detected faces or the main image content.
 * Size is relative to the detected object (percent values).
 *
 * @see https://uploadcare.com/docs/transformations/image/resize-crop/#operation-crop-by-objects
 * @example
 * ```ts
 * cropByTag('face', { ratio: '1:1' }) // → -/crop/face/1:1/
 * ```
 */
export const cropByTag = /* @__PURE__ */ namedOp(
  'crop',
  function cropByTag(
    tag: CropTag,
    options: {
      ratio?: string
      size?: [SizeValue, SizeValue]
      align?: Alignment
    } = {}
  ): CdnOperation {
    assertOneOf(tag, ['face', 'image'] as const, 'crop tag')
    const params: string[] = [tag]
    if (__DEV__ && options.ratio != null && options.size != null) {
      throw new TypeError('cropByTag accepts either ratio or size, not both')
    }
    if (options.ratio != null) {
      if (__DEV__ && !RATIO_RE.test(options.ratio)) {
        throw new RangeError(`Invalid crop ratio: "${options.ratio}"`)
      }
      params.push(options.ratio)
    }
    if (options.size != null) {
      params.push(dimensions(options.size[0], options.size[1], 'crop size'))
    }
    if (options.align != null)
      params.push(alignment(options.align, 'crop alignment'))
    return createOp('crop', ...params)
  }
)

/** Smart {@link scaleCrop} detection types (applied as a fallback chain). */
export const SCALE_CROP_TYPES = [
  'smart',
  'smart_faces_objects_points',
  'smart_faces_objects',
  'smart_faces_points',
  'smart_objects_faces_points',
  'smart_objects_faces',
  'smart_objects_points',
  'smart_points',
  'smart_objects',
  'smart_faces'
] as const
/** One of the {@link SCALE_CROP_TYPES} smart detection types. */
export type ScaleCropType = (typeof SCALE_CROP_TYPES)[number]

/**
 * Scales down and crops to exactly `WxH` (cover). Smart types use content
 * detection; the explicit alignment is then only a fallback.
 *
 * @see https://uploadcare.com/docs/transformations/image/resize-crop/#operation-scale-crop
 * @example
 * ```ts
 * scaleCrop(1252, 670, { type: 'smart' }) // → -/scale_crop/1252x670/smart/
 * ```
 */
export const scaleCrop = /* @__PURE__ */ namedOp(
  'scale_crop',
  function scaleCrop(
    width: number,
    height: number,
    options: { type?: ScaleCropType; align?: Alignment } = {}
  ): CdnOperation {
    const params = [dimensions(width, height, 'scale_crop')]
    if (options.type != null) {
      assertOneOf(options.type, SCALE_CROP_TYPES, 'scale_crop type')
      params.push(options.type)
    }
    if (options.align != null)
      params.push(alignment(options.align, 'scale_crop alignment'))
    return createOp('scale_crop', ...params)
  }
)

/** One or more (1–4) radius values in pixels or percent. */
export type Radii = SizeValue | SizeValue[]

function radiiList(value: Radii, label: string): string {
  const list = Array.isArray(value) ? value : [value]
  if (__DEV__ && (list.length < 1 || list.length > 4)) {
    throw new RangeError(`${label} accepts 1 to 4 radii`)
  }
  return list.map((r) => sizeValue(r, label)).join(',')
}

/**
 * CSS-like border radius; 1–4 radii in pixels or percent (`'50p'`), with an
 * optional second set of vertical radii.
 *
 * @see https://uploadcare.com/docs/transformations/image/resize-crop/#operation-border-radius
 * @example
 * ```ts
 * borderRadius('50p') // → -/border_radius/50p/ (circle crop)
 * ```
 */
export const borderRadius = /* @__PURE__ */ namedOp(
  'border_radius',
  function borderRadius(radii: Radii, verticalRadii?: Radii): CdnOperation {
    const params = [radiiList(radii, 'border_radius')]
    if (verticalRadii != null)
      params.push(radiiList(verticalRadii, 'border_radius vertical'))
    return createOp('border_radius', ...params)
  }
)

/**
 * Background fill color used by crop-outside-of-image, `stretch/fill` and
 * alpha-channel flattening into JPEG.
 *
 * @see https://uploadcare.com/docs/transformations/image/resize-crop/#operation-setfill
 * @example
 * ```ts
 * setfill('8d8578') // → -/setfill/8d8578/
 * ```
 */
export const setfill = /* @__PURE__ */ namedOp(
  'setfill',
  function setfill(fill: string): CdnOperation {
    return createOp('setfill', color(fill, 'setfill color'))
  }
)

/**
 * Zooms in on detected objects (1..100). Works on images with a solid or
 * uniform background only.
 *
 * @see https://uploadcare.com/docs/transformations/image/resize-crop/#operation-zoom-objects
 * @example
 * ```ts
 * zoomObjects(42) // → -/zoom_objects/42/
 * ```
 */
export const zoomObjects = /* @__PURE__ */ namedOp(
  'zoom_objects',
  function zoomObjects(zoom: number): CdnOperation {
    assertIntInRange(zoom, 1, 100, 'zoom_objects')
    return createOp('zoom_objects', String(zoom))
  }
)

/**
 * EXIF-based automatic rotation on/off (CDN default on).
 *
 * @see https://uploadcare.com/docs/transformations/image/resize-crop/#operation-autorotate
 * @example
 * ```ts
 * autorotate(false) // → -/autorotate/no/
 * ```
 */
export const autorotate = /* @__PURE__ */ namedOp(
  'autorotate',
  function autorotate(enabled: boolean): CdnOperation {
    return createOp('autorotate', enabled ? 'yes' : 'no')
  }
)

/**
 * Counterclockwise rotation; the angle must be a multiple of 90.
 *
 * @see https://uploadcare.com/docs/transformations/image/resize-crop/#operation-rotate
 * @example
 * ```ts
 * rotate(270) // → -/rotate/270/
 * ```
 */
export const rotate = /* @__PURE__ */ namedOp(
  'rotate',
  function rotate(angle: number): CdnOperation {
    if (__DEV__ && (!Number.isInteger(angle) || angle % 90 !== 0)) {
      throw new RangeError(
        `rotate angle must be a multiple of 90, got ${angle}`
      )
    }
    return createOp('rotate', String(angle))
  }
)

/**
 * Flips the image vertically.
 *
 * @see https://uploadcare.com/docs/transformations/image/resize-crop/#operation-flip
 * @example
 * ```ts
 * flip() // → -/flip/
 * ```
 */
export const flip = /* @__PURE__ */ namedOp(
  'flip',
  function flip(): CdnOperation {
    return createOp('flip')
  }
)

/**
 * Mirrors the image horizontally.
 *
 * @see https://uploadcare.com/docs/transformations/image/resize-crop/#operation-mirror
 * @example
 * ```ts
 * mirror() // → -/mirror/
 * ```
 */
export const mirror = /* @__PURE__ */ namedOp(
  'mirror',
  function mirror(): CdnOperation {
    return createOp('mirror')
  }
)

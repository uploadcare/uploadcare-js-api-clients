/**
 * Effects and enhancement operations.
 *
 * @see https://uploadcare.com/docs/effects-enhancements/
 */
import type { SizeValue } from '../grammar'
import { namedOp } from '../operation-ref'
import {
  assertIntInRange,
  assertOneOf,
  dimensions,
  sizeValue
} from '../grammar'
import type { CdnOperation } from '../types'
import { createOp } from './create-op'

function adjustment(
  name: string,
  value: number,
  min: number,
  max: number
): CdnOperation {
  assertIntInRange(value, min, max, name)
  return createOp(name, String(value))
}

/**
 * Brightness adjustment, -100..100 (neutral 0).
 *
 * @see https://uploadcare.com/docs/effects-enhancements/#operation-brightness
 * @example
 * ```ts
 * brightness(-20) // → -/brightness/-20/
 * ```
 */
export const brightness = /* @__PURE__ */ namedOp(
  'brightness',
  (value: number): CdnOperation => adjustment('brightness', value, -100, 100)
)

/**
 * Exposure adjustment, -500..500 (neutral 0).
 *
 * @see https://uploadcare.com/docs/effects-enhancements/#operation-exposure
 * @example
 * ```ts
 * exposure(150) // → -/exposure/150/
 * ```
 */
export const exposure = /* @__PURE__ */ namedOp(
  'exposure',
  (value: number): CdnOperation => adjustment('exposure', value, -500, 500)
)

/**
 * Gamma adjustment, 0..1000 (neutral 100).
 *
 * @see https://uploadcare.com/docs/effects-enhancements/#operation-gamma
 * @example
 * ```ts
 * gamma(120) // → -/gamma/120/
 * ```
 */
export const gamma = /* @__PURE__ */ namedOp(
  'gamma',
  (value: number): CdnOperation => adjustment('gamma', value, 0, 1000)
)

/**
 * Contrast adjustment, -100..500 (neutral 0).
 *
 * @see https://uploadcare.com/docs/effects-enhancements/#operation-contrast
 * @example
 * ```ts
 * contrast(25) // → -/contrast/25/
 * ```
 */
export const contrast = /* @__PURE__ */ namedOp(
  'contrast',
  (value: number): CdnOperation => adjustment('contrast', value, -100, 500)
)

/**
 * Saturation adjustment, -100..500 (neutral 0).
 *
 * @see https://uploadcare.com/docs/effects-enhancements/#operation-saturation
 * @example
 * ```ts
 * saturation(-50) // → -/saturation/-50/
 * ```
 */
export const saturation = /* @__PURE__ */ namedOp(
  'saturation',
  (value: number): CdnOperation => adjustment('saturation', value, -100, 500)
)

/**
 * Vibrance adjustment, -100..500 (neutral 0).
 *
 * @see https://uploadcare.com/docs/effects-enhancements/#operation-vibrance
 * @example
 * ```ts
 * vibrance(60) // → -/vibrance/60/
 * ```
 */
export const vibrance = /* @__PURE__ */ namedOp(
  'vibrance',
  (value: number): CdnOperation => adjustment('vibrance', value, -100, 500)
)

/**
 * Warmth adjustment, -100..100 (neutral 0).
 *
 * @see https://uploadcare.com/docs/effects-enhancements/#operation-warmth
 * @example
 * ```ts
 * warmth(30) // → -/warmth/30/
 * ```
 */
export const warmth = /* @__PURE__ */ namedOp(
  'warmth',
  (value: number): CdnOperation => adjustment('warmth', value, -100, 100)
)

/**
 * Automatic photo enhancement; strength 0..100 (CDN default 50).
 *
 * @see https://uploadcare.com/docs/effects-enhancements/#operation-enhance
 * @example
 * ```ts
 * enhance(75) // → -/enhance/75/
 * ```
 */
export const enhance = /* @__PURE__ */ namedOp(
  'enhance',
  function enhance(strength?: number): CdnOperation {
    if (strength == null) return createOp('enhance')
    assertIntInRange(strength, 0, 100, 'enhance strength')
    return createOp('enhance', String(strength))
  }
)

/**
 * Desaturates the image.
 *
 * @see https://uploadcare.com/docs/effects-enhancements/#operation-grayscale
 * @example
 * ```ts
 * grayscale() // → -/grayscale/
 * ```
 */
export const grayscale = /* @__PURE__ */ namedOp(
  'grayscale',
  function grayscale(): CdnOperation {
    return createOp('grayscale')
  }
)

/**
 * Inverts the image colors.
 *
 * @see https://uploadcare.com/docs/effects-enhancements/#operation-invert
 * @example
 * ```ts
 * invert() // → -/invert/
 * ```
 */
export const invert = /* @__PURE__ */ namedOp(
  'invert',
  function invert(): CdnOperation {
    return createOp('invert')
  }
)

/** Named photo filter presets accepted by {@link filter}. */
export const FILTER_NAMES = [
  'adaris',
  'briaril',
  'calarel',
  'carris',
  'cynarel',
  'cyren',
  'elmet',
  'elonni',
  'enzana',
  'erydark',
  'fenralan',
  'ferand',
  'galen',
  'gavin',
  'gethriel',
  'iorill',
  'iothari',
  'iselva',
  'jadis',
  'lavra',
  'misiara',
  'namala',
  'nerion',
  'nethari',
  'pamaya',
  'sarnar',
  'sedis',
  'sewen',
  'sorahel',
  'sorlen',
  'tarian',
  'thellassan',
  'varriel',
  'varven',
  'vevera',
  'virkas',
  'yedis',
  'yllara',
  'zatvel',
  'zevcen'
] as const
/** One of the {@link FILTER_NAMES} presets. */
export type FilterName = (typeof FILTER_NAMES)[number]

/**
 * Named photo filter; amount -100..200 (CDN default 100).
 *
 * @see https://uploadcare.com/docs/effects-enhancements/#operation-filter
 * @example
 * ```ts
 * filter('iothari', 150) // → -/filter/iothari/150/
 * ```
 */
export const filter = /* @__PURE__ */ namedOp(
  'filter',
  function filter(name: FilterName | string, amount?: number): CdnOperation {
    assertOneOf(name, FILTER_NAMES, 'filter name')
    if (amount == null) return createOp('filter', name)
    assertIntInRange(amount, -100, 200, 'filter amount')
    return createOp('filter', name, String(amount))
  }
)

/**
 * Gaussian blur; strength 0..5000 (CDN default 10), amount -200..100
 * (negative values sharpen via an unsharp mask).
 *
 * @see https://uploadcare.com/docs/effects-enhancements/#operation-blur
 * @example
 * ```ts
 * blur(20) // → -/blur/20/
 * ```
 */
export const blur = /* @__PURE__ */ namedOp(
  'blur',
  function blur(strength?: number, amount?: number): CdnOperation {
    if (strength == null) {
      if (__DEV__ && amount != null) {
        throw new TypeError('blur amount requires a strength')
      }
      return createOp('blur')
    }
    assertIntInRange(strength, 0, 5000, 'blur strength')
    if (amount == null) return createOp('blur', String(strength))
    assertIntInRange(amount, -200, 100, 'blur amount')
    return createOp('blur', String(strength), String(amount))
  }
)

/** Options for {@link blurRegion}: a rectangle, or all detected faces. */
export type BlurRegionOptions =
  | {
      /** Region width in px or percent. */
      width: SizeValue
      /** Region height in px or percent. */
      height: SizeValue
      /** Region left offset in px or percent. */
      x: SizeValue
      /** Region top offset in px or percent. */
      y: SizeValue
      /** Blur strength, 0..5000 (CDN default 10). */
      strength?: number
    }
  | {
      /** Blur every detected face instead of a fixed region. */
      faces: true
      /** Blur strength, 0..5000 (CDN default 10). */
      strength?: number
    }

/**
 * Blurs a rectangular region, or every detected face. Repeatable.
 *
 * @see https://uploadcare.com/docs/effects-enhancements/#operation-blur-region
 * @example
 * ```ts
 * blurRegion({ faces: true }) // → -/blur_region/faces/
 * blurRegion({ width: 100, height: 50, x: 10, y: 20 }) // → -/blur_region/100x50/10,20/
 * ```
 */
export const blurRegion = /* @__PURE__ */ namedOp(
  'blur_region',
  function blurRegion(options: BlurRegionOptions): CdnOperation {
    const params: string[] = []
    if ('faces' in options) {
      params.push('faces')
    } else {
      params.push(dimensions(options.width, options.height, 'blur_region'))
      params.push(
        `${sizeValue(options.x, 'blur_region x')},${sizeValue(options.y, 'blur_region y')}`
      )
    }
    if (options.strength != null) {
      assertIntInRange(options.strength, 0, 5000, 'blur_region strength')
      params.push(String(options.strength))
    }
    return createOp('blur_region', ...params)
  }
)

/**
 * Sharpens the image; strength 0..20 (CDN default 5).
 *
 * @see https://uploadcare.com/docs/effects-enhancements/#operation-sharp
 * @example
 * ```ts
 * sharp(10) // → -/sharp/10/
 * ```
 */
export const sharp = /* @__PURE__ */ namedOp(
  'sharp',
  function sharp(strength?: number): CdnOperation {
    if (strength == null) return createOp('sharp')
    assertIntInRange(strength, 0, 20, 'sharp strength')
    return createOp('sharp', String(strength))
  }
)

/** Allowed {@link srgb} conversion modes. */
export const SRGB_MODES = ['fast', 'icc', 'keep_profile'] as const
/** One of the {@link SRGB_MODES} values. */
export type SrgbMode = (typeof SRGB_MODES)[number]

/**
 * Color profile conversion to sRGB.
 *
 * @see https://uploadcare.com/docs/effects-enhancements/#operation-srgb
 * @example
 * ```ts
 * srgb('icc') // → -/srgb/icc/
 * ```
 */
export const srgb = /* @__PURE__ */ namedOp(
  'srgb',
  function srgb(mode: SrgbMode): CdnOperation {
    assertOneOf(mode, SRGB_MODES, 'srgb mode')
    return createOp('srgb', mode)
  }
)

/**
 * ICC profile size threshold in KB for the `srgb/icc` mode (CDN default 10).
 *
 * @see https://uploadcare.com/docs/effects-enhancements/#operation-max-icc-size
 * @example
 * ```ts
 * maxIccSize(20) // → -/max_icc_size/20/
 * ```
 */
export const maxIccSize = /* @__PURE__ */ namedOp(
  'max_icc_size',
  function maxIccSize(kb: number): CdnOperation {
    if (__DEV__ && (!Number.isInteger(kb) || kb < 0)) {
      throw new RangeError(
        `max_icc_size must be a non-negative integer, got ${kb}`
      )
    }
    return createOp('max_icc_size', String(kb))
  }
)

/**
 * Returns the dominant colors as JSON; must be the **last** operation.
 *
 * @see https://uploadcare.com/docs/effects-enhancements/#operation-main-colors
 * @example
 * ```ts
 * mainColors(8) // → -/main_colors/8/
 * ```
 */
export const mainColors = /* @__PURE__ */ namedOp(
  'main_colors',
  function mainColors(count?: number): CdnOperation {
    if (count == null) return createOp('main_colors')
    assertIntInRange(count, 1, 256, 'main_colors count')
    return createOp('main_colors', String(count))
  }
)

/**
 * Returns file/image info as JSON instead of the image itself.
 *
 * @see https://uploadcare.com/docs/cdn-operations/#operation-json
 * @example
 * ```ts
 * json() // → -/json/
 * ```
 */
export const json = /* @__PURE__ */ namedOp(
  'json',
  function json(): CdnOperation {
    return createOp('json')
  }
)

/**
 * Returns file/image info as JSONP (`uploadcare_callback`).
 *
 * @see https://uploadcare.com/docs/cdn-operations/#operation-json
 * @example
 * ```ts
 * jsonp() // → -/jsonp/
 * ```
 */
export const jsonp = /* @__PURE__ */ namedOp(
  'jsonp',
  function jsonp(): CdnOperation {
    return createOp('jsonp')
  }
)

/**
 * Overlay and watermark operations.
 *
 * @see https://uploadcare.com/docs/transformations/image/overlay/
 */
import type { Alignment, SizeValue } from '../grammar'
import { namedOp } from '../operation-ref'
import {
  alignment,
  assertIntInRange,
  assertOneOf,
  color,
  dimensions,
  isArray,
  sizeValue
} from '../grammar'
import type { CdnOperation } from '../types'
import { rawOp } from './raw-op'

/** A point given as an alignment keyword, offsets object or `[x, y]` pair. */
export type RelativePoint = Alignment | readonly [SizeValue, SizeValue]

function relativePoint(value: RelativePoint, label: string): string {
  if (isArray(value)) {
    return `${sizeValue(value[0], `${label} x`)},${sizeValue(value[1], `${label} y`)}`
  }
  return alignment(value, label)
}

/**
 * Overlay source: another file's UUID, or `'self'` for the image itself.
 * The `& {}` keeps `'self'` in autocomplete without collapsing to `string`.
 */
export type OverlaySource = 'self' | (string & {})

/** Options for {@link overlay}. Params are positional and ordered. */
export interface OverlayOptions {
  /** Relative size, e.g. `['50p', '50p']` (CDN default 100%). */
  size?: readonly [SizeValue, SizeValue]
  /** Position keyword or coordinates (CDN default top-left). */
  position?: RelativePoint
  /** Opacity, e.g. `'40p'`. */
  opacity?: SizeValue
}

/**
 * Overlays another file (by uuid) or the image itself (`'self'`).
 * Repeatable — overlays stack in chain order. Because the CDN params are
 * positional, `position` requires `size` and `opacity` requires `position`.
 *
 * @see https://uploadcare.com/docs/transformations/image/overlay/#overlay-image
 * @example
 * ```ts
 * overlay('self', { size: ['50p', '50p'], position: 'center', opacity: '40p' })
 * // → -/overlay/self/50px50p/center/40p/
 * ```
 */
export const overlay = /* @__PURE__ */ namedOp(
  'overlay',
  function overlay(
    source: OverlaySource,
    options: OverlayOptions = {}
  ): CdnOperation {
    const params: string[] = [source]
    const { size, position, opacity } = options
    if (__DEV__ && (position != null || opacity != null) && size == null) {
      throw new TypeError(
        'overlay position/opacity require a size (params are ordered)'
      )
    }
    if (__DEV__ && opacity != null && position == null) {
      throw new TypeError(
        'overlay opacity requires a position (params are ordered)'
      )
    }
    if (size != null) params.push(dimensions(size[0], size[1], 'overlay size'))
    if (position != null)
      params.push(relativePoint(position, 'overlay position'))
    if (opacity != null) params.push(sizeValue(opacity, 'overlay opacity'))
    return rawOp('overlay', ...params)
  }
)

/**
 * Draws a solid color rectangle. Repeatable.
 *
 * @see https://uploadcare.com/docs/transformations/image/overlay/#overlay-solid
 * @example
 * ```ts
 * rect('9f9', ['50p', '33p'], 'center') // → -/rect/9f9/50px33p/center/
 * ```
 */
export const rect = /* @__PURE__ */ namedOp(
  'rect',
  function rect(
    fill: string,
    size: readonly [SizeValue, SizeValue],
    position: RelativePoint
  ): CdnOperation {
    return rawOp(
      'rect',
      color(fill, 'rect color'),
      dimensions(size[0], size[1], 'rect size'),
      relativePoint(position, 'rect position')
    )
  }
)

/**
 * Applies the documented `~s` (slash), `~n` (newline), `~~` (tilde) sequences,
 * then percent-encodes the rest, which the CDN requires: a raw `#` or `?` would
 * otherwise end the path.
 */
function escapeText(value: string): string {
  return encodeURIComponent(
    value.replaceAll('~', '~~').replaceAll('/', '~s').replaceAll('\n', '~n')
  )
}

/**
 * Text overlay (disabled by default; enabled per project). The string is
 * escaped per the documented `~s`/`~n`/`~~` rules and percent-encoded.
 *
 * @see https://uploadcare.com/docs/transformations/image/overlay/#overlay-text
 * @example
 * ```ts
 * text(['80p', '20p'], 'bottom', 'Hello') // → -/text/80px20p/bottom/Hello/
 * ```
 */
export const text = /* @__PURE__ */ namedOp(
  'text',
  function text(
    size: readonly [SizeValue, SizeValue],
    position: RelativePoint,
    value: string
  ): CdnOperation {
    return rawOp(
      'text',
      dimensions(size[0], size[1], 'text size'),
      relativePoint(position, 'text position'),
      escapeText(value)
    )
  }
)

/** Horizontal alignment for {@link textAlign}. */
export type TextHAlign = 'left' | 'right' | 'center'
/** Vertical alignment for {@link textAlign}. */
export type TextVAlign = 'top' | 'bottom' | 'center'

/**
 * Alignment state for the **following** {@link text} operation
 * (CDN default center/center).
 *
 * @see https://uploadcare.com/docs/transformations/image/overlay/#overlay-text
 * @example
 * ```ts
 * textAlign('center', 'bottom') // → -/text_align/center/bottom/
 * ```
 */
export const textAlign = /* @__PURE__ */ namedOp(
  'text_align',
  function textAlign(halign: TextHAlign, valign: TextVAlign): CdnOperation {
    assertOneOf(halign, ['left', 'right', 'center'] as const, 'text halign')
    assertOneOf(valign, ['top', 'bottom', 'center'] as const, 'text valign')
    return rawOp('text_align', halign, valign)
  }
)

/** Weights accepted by {@link font}. */
export const FONT_WEIGHTS = ['regular', 'bold'] as const
/** One of the {@link FONT_WEIGHTS} values. */
export type FontWeight = (typeof FONT_WEIGHTS)[number]
/** Styles accepted by {@link font}. */
export const FONT_STYLES = ['normal', 'italic'] as const
/** One of the {@link FONT_STYLES} values. */
export type FontStyle = (typeof FONT_STYLES)[number]
/** Families accepted by {@link font}. */
export const FONT_FAMILIES = [
  'DejaVu',
  'DejaVuMono',
  'DejaVuSerif',
  'Noto',
  'NotoMono',
  'NotoSerif'
] as const
/** One of the {@link FONT_FAMILIES} values. */
export type FontFamily = (typeof FONT_FAMILIES)[number]

/** What {@link font} sets; give at least one. */
export interface FontOptions {
  /** Resets every font setting to the CDN default first. */
  reset?: boolean
  /** CDN default `regular`. */
  weight?: FontWeight
  /** CDN default `normal`. */
  style?: FontStyle
  /** Size in pixels, 1..1000 (CDN default 10). */
  size?: number
  /** Hex color, optionally with alpha (CDN default `000000`). */
  color?: string
  /** CDN default `DejaVu`. */
  family?: FontFamily
}

/**
 * Font state for the **following** {@link text} operation. Only the parts you
 * give are written, in the order the CDN requires.
 *
 * @see https://uploadcare.com/docs/transformations/image/overlay/#overlay-text
 * @example
 * ```ts
 * font({ size: 24, color: 'fff' }) // → -/font/24/fff/
 * font({ weight: 'bold', family: 'DejaVuSerif' }) // → -/font/bold/DejaVuSerif/
 * ```
 */
export const font = /* @__PURE__ */ namedOp(
  'font',
  function font(options: FontOptions): CdnOperation {
    const { reset, weight, style, size, color: fill, family } = options
    const params: string[] = []
    if (reset === true) params.push('reset')
    if (weight != null) {
      assertOneOf(weight, FONT_WEIGHTS, 'font weight')
      params.push(weight)
    }
    if (style != null) {
      assertOneOf(style, FONT_STYLES, 'font style')
      params.push(style)
    }
    if (size != null) {
      assertIntInRange(size, 1, 1000, 'font size')
      params.push(String(size))
    }
    if (fill != null) params.push(color(fill, 'font color'))
    if (family != null) {
      assertOneOf(family, FONT_FAMILIES, 'font family')
      params.push(family)
    }
    if (__DEV__ && params.length === 0) {
      throw new RangeError('font needs at least one setting')
    }
    return rawOp('font', ...params)
  }
)

/** Allowed {@link textBox} modes. */
export const TEXT_BOX_MODES = ['none', 'fit', 'line', 'fill'] as const
/** One of the {@link TEXT_BOX_MODES} values. */
export type TextBoxMode = (typeof TEXT_BOX_MODES)[number]

function assertNonNegativeInt(value: number, label: string): void {
  if (__DEV__ && (!Number.isInteger(value) || value < 0)) {
    throw new RangeError(
      `${label} must be a non-negative integer, got ${value}`
    )
  }
}

/**
 * Background box state for the **following** {@link text} operation. The
 * parts are positional, so a padding needs a color before it, and a border
 * radius writes a zero padding when none is given.
 *
 * @see https://uploadcare.com/docs/transformations/image/overlay/#overlay-text
 * @example
 * ```ts
 * textBox('fill', '000', 10) // → -/text_box/fill/000/10/
 * textBox('fit', 'ff000080', 10, 15) // → -/text_box/fit/ff000080/10/15/
 * ```
 */
export const textBox = /* @__PURE__ */ namedOp(
  'text_box',
  function textBox(
    mode: TextBoxMode,
    fill?: string,
    padding?: number,
    borderRadius?: number
  ): CdnOperation {
    assertOneOf(mode, TEXT_BOX_MODES, 'text_box mode')
    const params: string[] = [mode]
    if (fill == null) {
      if (__DEV__ && (padding != null || borderRadius != null)) {
        throw new TypeError(
          'text_box padding and radius need a color before them'
        )
      }
      return rawOp('text_box', ...params)
    }
    params.push(color(fill, 'text_box color'))
    if (padding == null && borderRadius == null) {
      return rawOp('text_box', ...params)
    }
    if (padding != null) assertNonNegativeInt(padding, 'text_box padding')
    params.push(String(padding ?? 0))
    if (borderRadius != null) {
      assertNonNegativeInt(borderRadius, 'text_box border radius')
      params.push(String(borderRadius))
    }
    return rawOp('text_box', ...params)
  }
)

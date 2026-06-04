/**
 * Overlay and watermark operations.
 *
 * @see https://uploadcare.com/docs/transformations/image/overlay/
 */
import type { Alignment, SizeValue } from '../grammar'
import { namedOp } from '../operation-ref'
import {
  alignment,
  assertOneOf,
  color,
  dimensions,
  sizeValue
} from '../grammar'
import type { CdnOperation } from '../types'
import { createOp } from './create-op'

/** A point given as an alignment keyword, offsets object or `[x, y]` pair. */
export type RelativePoint = Alignment | [SizeValue, SizeValue]

function relativePoint(value: RelativePoint, label: string): string {
  if (Array.isArray(value)) {
    return `${sizeValue(value[0], `${label} x`)},${sizeValue(value[1], `${label} y`)}`
  }
  return alignment(value, label)
}

/** Options for {@link overlay}. Params are positional and ordered. */
export interface OverlayOptions {
  /** Relative size, e.g. `['50p', '50p']` (CDN default 100%). */
  size?: [SizeValue, SizeValue]
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
    source: string | 'self',
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
    return createOp('overlay', ...params)
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
    size: [SizeValue, SizeValue],
    position: RelativePoint
  ): CdnOperation {
    return createOp(
      'rect',
      color(fill, 'rect color'),
      dimensions(size[0], size[1], 'rect size'),
      relativePoint(position, 'rect position')
    )
  }
)

/** Escapes the documented `~s` (slash), `~n` (newline), `~~` (tilde) sequences. */
function escapeText(value: string): string {
  return value
    .replaceAll('~', '~~')
    .replaceAll('/', '~s')
    .replaceAll('\n', '~n')
}

/**
 * Text overlay (disabled by default; enabled per project). The string is
 * escaped per the documented `~s`/`~n`/`~~` rules.
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
    size: [SizeValue, SizeValue],
    position: RelativePoint,
    value: string
  ): CdnOperation {
    return createOp(
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
    return createOp('text_align', halign, valign)
  }
)

/**
 * Font state for the **following** {@link text} operation
 * (CDN defaults: size 10, black).
 *
 * @see https://uploadcare.com/docs/transformations/image/overlay/#overlay-text
 * @example
 * ```ts
 * font(24, 'fff') // → -/font/24/fff/
 * ```
 */
export const font = /* @__PURE__ */ namedOp(
  'font',
  function font(size: number, fill?: string): CdnOperation {
    if (__DEV__ && (!Number.isInteger(size) || size <= 0)) {
      throw new RangeError(`font size must be a positive integer, got ${size}`)
    }
    return fill == null
      ? createOp('font', String(size))
      : createOp('font', String(size), color(fill, 'font color'))
  }
)

/** Allowed {@link textBox} modes. */
export const TEXT_BOX_MODES = ['none', 'fit', 'line', 'fill'] as const
/** One of the {@link TEXT_BOX_MODES} values. */
export type TextBoxMode = (typeof TEXT_BOX_MODES)[number]

/**
 * Background box state for the **following** {@link text} operation.
 *
 * @see https://uploadcare.com/docs/transformations/image/overlay/#overlay-text
 * @example
 * ```ts
 * textBox('fill', '000', 10) // → -/text_box/fill/000/10/
 * ```
 */
export const textBox = /* @__PURE__ */ namedOp(
  'text_box',
  function textBox(
    mode: TextBoxMode,
    fill?: string,
    padding?: number
  ): CdnOperation {
    assertOneOf(mode, TEXT_BOX_MODES, 'text_box mode')
    const params: string[] = [mode]
    if (fill != null) params.push(color(fill, 'text_box color'))
    if (padding != null) {
      if (__DEV__ && (!Number.isInteger(padding) || padding < 0)) {
        throw new RangeError(
          `text_box padding must be a non-negative integer, got ${padding}`
        )
      }
      params.push(String(padding))
    }
    return createOp('text_box', ...params)
  }
)

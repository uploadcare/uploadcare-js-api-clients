/**
 * Shared value grammars for CDN operation parameters.
 *
 * Validation throws only in the development bundle (`__DEV__`); the
 * production bundle skips the checks and serializes inputs as-is.
 */

export const UUID_SOURCE =
  '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
export const UUID_RE = new RegExp(`^${UUID_SOURCE}$`, 'i')
export const GROUP_ID_RE = new RegExp(`^(${UUID_SOURCE})~([0-9]+)$`, 'i')

/** Strips trailing slashes from an origin or endpoint. */
export function trimTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '')
}

/** A dimension value: pixels as a number, or a percentage as `'50p'` / `'50%'`. */
export type SizeValue = number | string

const PERCENT_RE = /^\d+(\.\d+)?(p|%)$/

/** Serializes a single size value; `%` is normalized to the `p` shortcut. */
export function sizeValue(value: SizeValue, label = 'size'): string {
  if (typeof value === 'number') {
    if (__DEV__ && (!Number.isFinite(value) || value < 0)) {
      throw new RangeError(`Invalid ${label}: ${value}`)
    }
    return String(value)
  }
  if (__DEV__ && !PERCENT_RE.test(value)) {
    throw new RangeError(
      `Invalid ${label}: "${value}" (expected number or percent like "50p")`
    )
  }
  return value.replace('%', 'p')
}

/** `WxH` where either side may be omitted. */
export function dimensions(
  width?: SizeValue,
  height?: SizeValue,
  label = 'dimensions'
): string {
  if (__DEV__ && width == null && height == null) {
    throw new TypeError(`At least one of width/height is required for ${label}`)
  }
  const w = width == null ? '' : sizeValue(width, `${label} width`)
  const h = height == null ? '' : sizeValue(height, `${label} height`)
  return `${w}x${h}`
}

/** Alignment keywords accepted wherever an {@link Alignment} is expected. */
export const ALIGN_KEYWORDS = [
  'center',
  'top',
  'right',
  'bottom',
  'left'
] as const
/** One of the {@link ALIGN_KEYWORDS} alignment keywords. */
export type AlignKeyword = (typeof ALIGN_KEYWORDS)[number]
/** Position: an alignment keyword, or explicit offsets (px or percent). */
export type Alignment =
  | AlignKeyword
  | {
      /** Horizontal offset in px or percent (`'10p'`). */
      x: SizeValue
      /** Vertical offset in px or percent (`'10p'`). */
      y: SizeValue
    }

/** Offset values may be negative pixel numbers (crop). */
function offsetValue(value: SizeValue, label: string): string {
  if (typeof value === 'number') {
    if (__DEV__ && !Number.isFinite(value)) {
      throw new RangeError(`Invalid ${label}: ${value}`)
    }
    return String(value)
  }
  return sizeValue(value, label)
}

export function alignment(value: Alignment, label = 'alignment'): string {
  if (typeof value === 'string') {
    if (__DEV__ && !ALIGN_KEYWORDS.includes(value)) {
      throw new RangeError(`Invalid ${label}: "${value}"`)
    }
    return value
  }
  return `${offsetValue(value.x, `${label} x`)},${offsetValue(value.y, `${label} y`)}`
}

const COLOR_RE = /^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/** Hex color without `#`: `rgb`, `rrggbb` or `rrggbbaa`. */
export function color(value: string, label = 'color'): string {
  if (__DEV__ && !COLOR_RE.test(value)) {
    throw new RangeError(
      `Invalid ${label}: "${value}" (expected hex like "9f9", "99ff99" or "99ff9920")`
    )
  }
  return value
}

export function assertIntInRange(
  value: number,
  min: number,
  max: number,
  label: string
): void {
  if (!__DEV__) return
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(
      `${label} must be an integer in ${min}..${max}, got ${value}`
    )
  }
}

export function assertOneOf<T extends string>(
  value: string,
  allowed: readonly T[],
  label: string
): asserts value is T {
  if (!__DEV__) return
  if (!(allowed as readonly string[]).includes(value)) {
    throw new RangeError(
      `${label} must be one of ${allowed.join(', ')}; got "${value}"`
    )
  }
}

import type {
  Format,
  Quality,
  ScaleCropType,
  StretchMode,
  StripMetaMode,
  SrgbMode,
  FilterName
} from './ops'

/**
 * Operations as **typed string literals**, for callers whose only need is to write
 * a modifiers chain they author themselves.
 *
 * The creators in `/ops` build `CdnOperation` objects and validate their inputs.
 * That validation is `__DEV__`-only, so a production bundle carries the creator
 * machinery — `createOp`, the `namedOp` wrapper that makes a creator usable as an
 * `OperationRef`, the `dimensions`/`alignment` grammar helpers — without any of the
 * checks. For a caller that never inspects an operation and never uses
 * `without(resize)`, that machinery is pure weight.
 *
 * Measured on the twenty operations an image editor typically writes:
 * **852 → 254 B brotli** (2193 → 445 raw), emitting a byte-identical chain.
 *
 * What the types still catch, at zero runtime cost:
 *
 * - every enum — `format`, `quality`, `stretch`, `strip_meta`, `srgb`,
 *   `scale_crop` type, and all 40 filter names — reusing the same types the
 *   creators use, so the two cannot disagree;
 * - the shape and arity of each operation, e.g. `crop/640x480/10,20`.
 *
 * What they cannot, and what you give up by choosing this over the creators:
 *
 * - **numeric ranges.** `'brightness/500'` type-checks; `brightness(500)` throws in
 *   a development build. If you take numbers from user input, prefer the creators.
 * - **the uuid in `overlay/<uuid>`**, which no template literal type can express.
 *
 * @see https://uploadcare.com/docs/transformations/image/
 * @example
 * ```ts
 * modifiers('format/auto', `resize/${width}x`, 'quality/normal')
 * // → '-/format/auto/-/resize/300x/-/quality/normal/'
 * ```
 */
export type OperationLiteral =
  // compression
  | `format/${Format}`
  | `quality/${Quality}`
  | 'progressive/yes'
  | 'progressive/no'
  | `strip_meta/${StripMetaMode}`
  | 'inline/yes'
  | 'inline/no'
  | 'rasterize'
  // colour
  | `brightness/${number}`
  | `exposure/${number}`
  | `gamma/${number}`
  | `contrast/${number}`
  | `saturation/${number}`
  | `vibrance/${number}`
  | `warmth/${number}`
  | `enhance/${number}`
  | 'grayscale'
  | 'invert'
  | `filter/${FilterName}`
  | `filter/${FilterName}/${number}`
  | `srgb/${SrgbMode}`
  | `max_icc_size/${number}`
  // blur and sharpen
  | 'blur'
  | `blur/${number}`
  | `blur/${number}/${number}`
  | `sharp/${number}`
  // geometry
  | 'preview'
  | `preview/${number}x${number}`
  | `resize/${number}x`
  | `resize/x${number}`
  | `resize/${number}x${number}`
  | `smart_resize/${number}x${number}`
  | `stretch/${StretchMode}`
  | `crop/${number}x${number}`
  | `crop/${number}x${number}/${number},${number}`
  | `crop/${number}x${number}/${CropAlignment}`
  | `crop/${number}:${number}`
  | `crop/${number}:${number}/${CropAlignment}`
  | `scale_crop/${number}x${number}`
  | `scale_crop/${number}x${number}/${CropAlignment}`
  | `scale_crop/${number}x${number}/${ScaleCropType}`
  | `scale_crop/${number}x${number}/${number},${number}`
  | `border_radius/${string}`
  | `setfill/${string}`
  | 'autorotate/yes'
  | 'autorotate/no'
  | `rotate/${number}`
  | 'flip'
  | 'mirror'
  | `zoom_objects/${number}`
  // information
  | 'json'
  | `jsonp/${string}`
  | `main_colors/${number}`

/** Alignment keywords accepted where a crop offset may be given. */
export type CropAlignment =
  | 'center'
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | `${'top' | 'center' | 'bottom'},${'left' | 'center' | 'right'}`

/**
 * Escape hatch for an operation {@link OperationLiteral} cannot express — an
 * `overlay` with a uuid, a `text` with arbitrary content, or a directive newer than
 * this package.
 *
 * Nothing is checked; that is the point. Prefer a creator from `/ops` when one
 * exists, and reach for this only when the alternative is a cast.
 *
 * @example
 * ```ts
 * modifiers('preview', unsafeOperation(`overlay/${uuid}/50%x50%/center`))
 * ```
 */
export function unsafeOperation(operation: string): OperationLiteral {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the widening is the feature: this is the one sanctioned way past the union, so callers never write the cast themselves
  return operation as OperationLiteral
}

/**
 * Joins typed operation literals into a modifiers chain — the whole runtime cost
 * of this module.
 *
 * Equivalent to `serializeOperations` for callers holding literals rather than
 * `CdnOperation` objects, and round-trips with `parseOperations` the same way.
 *
 * @example
 * ```ts
 * modifiers('format/auto', 'progressive/yes') // → '-/format/auto/-/progressive/yes/'
 * modifiers() // → ''
 * ```
 */
export function modifiers(...operations: OperationLiteral[]): string {
  return operations.map((operation) => `-/${operation}/`).join('')
}

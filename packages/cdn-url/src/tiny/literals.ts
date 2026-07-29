import type {
  Format,
  Quality,
  ScaleCropType,
  StretchMode,
  StripMetaMode,
  SrgbMode,
  FilterName
} from '../ops'

/**
 * Operations as **typed string literals**, for callers whose only need is to write
 * a modifiers chain they author themselves.
 *
 * The creators in `/ops` build `CdnOperation` objects and validate their inputs.
 * That validation is `__DEV__`-only, so a production bundle carries the creator
 * machinery — `rawOp`, the `namedOp` wrapper that makes a creator usable as an
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

declare const CHAIN: unique symbol

/**
 * A `-/name/params/` directive chain, **nominally** typed: a plain string at run
 * time, but assignable only from a value this module produced — `modifiers()`,
 * {@link normalizeModifiers}, `joinModifiers()` or `tinyParse`.
 *
 * A pattern type (`` `${string}/` ``) was tried first and rejected: any string
 * ending in a slash satisfied it, which is barely a type. The brand instead states
 * the invariant that matters — *this string went through the chain machinery* — so
 * a hand-written `'-/resize/300x/'`, a stored `'resize/300x'` and a stray `''` are
 * all rejected until normalized. It costs nothing at run time and one cast in each
 * producer, which is how a brand works.
 *
 * Operation names are still {@link OperationLiteral}'s business; the brand says
 * where a chain came from, not that every directive in it is spelled right.
 *
 * @see https://uploadcare.com/docs/cdn-operations/
 * @example
 * ```ts
 * const chain: ModifiersChain = modifiers('preview', 'blur/10')
 * const longer: ModifiersChain = joinModifiers(chain, modifiers('grayscale'))
 * const stored: ModifiersChain = normalizeModifiers('/resize/300x')
 * const empty: ModifiersChain = modifiers() // '' needs a producer too
 * ```
 */
export type ModifiersChain = string & {
  /** Brand marker. Exists only in the type system — never present at run time. */
  readonly [CHAIN]: true
}

/**
 * Joins typed operation literals into a {@link ModifiersChain} —
 * the whole runtime cost of this module.
 *
 * Equivalent to `serializeOperations` for callers holding literals rather than
 * `CdnOperation` objects, and round-trips with `parseOperations` the same way.
 * Call it with no arguments for the empty chain.
 *
 * @example
 * ```ts
 * modifiers('format/auto', 'progressive/yes') // → '-/format/auto/-/progressive/yes/'
 * modifiers() // → ''
 * ```
 */
export function modifiers(...operations: OperationLiteral[]): ModifiersChain {
  let chain = ''
  for (const operation of operations) chain += `-/${operation}/`
  return asModifiersChain(chain)
}

/**
 * Concatenates chains — the branded stand-in for `` `${a}${b}` ``, which would
 * widen back to `string`. Order is preserved, so this is how you append to a chain
 * you already have.
 *
 * @see https://uploadcare.com/docs/cdn-operations/
 * @example
 * ```ts
 * joinModifiers(parts.modifiers, modifiers('resize/300x', 'blur/10'))
 * // → '-/preview/-/resize/300x/-/blur/10/'
 * ```
 */
export function joinModifiers(...chains: ModifiersChain[]): ModifiersChain {
  return asModifiersChain(chains.join(''))
}

/**
 * Brands a string as a {@link ModifiersChain}. The single place the cast lives —
 * every producer in the package routes through here, including `tinyParse`, so the
 * brand has exactly one entrance.
 *
 * @internal
 */
export function asModifiersChain(chain: string): ModifiersChain {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- applying the brand is the one operation a nominal type cannot express without a cast; every producer routes through here so there is exactly one
  return chain as ModifiersChain
}

/**
 * Normalizes a modifiers string of any shape into a {@link ModifiersChain} — the
 * string-level counterpart of `parseOperations`, and the way a value that did not
 * come from `modifiers()` becomes a chain.
 *
 * The same leniency `parseOperations` grants, for the same reason: these values
 * arrive from config, DOM attributes and stored `cdnUrlModifiers` alike, so the
 * leading `-` marker, surrounding slashes, doubled slashes and surrounding
 * whitespace are all tolerated. Operations within a chain still separate on `-`,
 * which keeps `resize/300x/-/blur/10` unambiguous. Nothing is validated: a
 * malformed chain is accepted, not diagnosed.
 *
 * @see https://uploadcare.com/docs/cdn-operations/
 * @example
 * ```ts
 * normalizeModifiers('resize/100x') // → '-/resize/100x/'
 * normalizeModifiers('/resize//100x/') // → '-/resize/100x/'
 * normalizeModifiers('  -/resize/100x/  ') // → '-/resize/100x/'
 * normalizeModifiers('resize/300x/-/blur/10') // → '-/resize/300x/-/blur/10/'
 * normalizeModifiers('') // → ''
 * ```
 */
export function normalizeModifiers(value: string): ModifiersChain {
  // split/filter/join collapses runs of slashes and drops the ones at either end
  // in one pass — the same shape as `segmentize` in parse.ts, no regex needed.
  const chain = value
    .trim()
    .split('/')
    .filter((segment) => segment !== '')
    .join('/')
  if (chain === '') return asModifiersChain('')
  return asModifiersChain(chain.startsWith('-/') ? `${chain}/` : `-/${chain}/`)
}

/**
 * Cross-operation validation: encodes the CDN rules that individual
 * operation creators cannot check on their own. Non-throwing — returns
 * diagnostics so callers decide what to do with them.
 */
import type { CdnOperation, ConversionKind } from '../types'

/** How serious a {@link Diagnostic} is. */
export type DiagnosticSeverity = 'error' | 'warning' | 'info'

/** A single finding produced by {@link validateOperations}. */
export type Diagnostic = {
  /** Severity of the finding. */
  severity: DiagnosticSeverity
  /** Stable machine-readable code, e.g. `no-core-operation`. */
  code: string
  /** Human-readable explanation. */
  message: string
  /** Index into the validated operations array, when applicable. */
  opIndex?: number
}

/** Options for {@link validateOperations}. */
export type ValidationContext = {
  /** Apply conversion-path rules (`video` etc.) instead of image rules. */
  conversion?: ConversionKind
}

/** Ops that make the CDN actually process an image. */
const CORE_OPS = new Set(['preview', 'resize', 'smart_resize', 'scale_crop'])

/** Info-returning ops: a chain of only these needs no core operation. */
const INFO_OPS = new Set(['json', 'jsonp', 'main_colors'])

/** Image ops that must be the last directive in the chain. */
const MUST_BE_LAST = new Set(['main_colors', 'json', 'jsonp'])

/** Ops that may legitimately appear multiple times. */
const REPEATABLE = new Set([
  'overlay',
  'rect',
  'text',
  'text_align',
  'font',
  'text_box',
  'blur_region',
  'stretch',
  'resize',
  'scale_crop',
  'crop'
])

const KNOWN_IMAGE_OPS = new Set([
  'preview',
  'resize',
  'smart_resize',
  'stretch',
  'crop',
  'scale_crop',
  'border_radius',
  'setfill',
  'zoom_objects',
  'autorotate',
  'rotate',
  'flip',
  'mirror',
  'brightness',
  'exposure',
  'gamma',
  'contrast',
  'saturation',
  'vibrance',
  'warmth',
  'enhance',
  'grayscale',
  'invert',
  'filter',
  'blur',
  'blur_region',
  'sharp',
  'srgb',
  'max_icc_size',
  'main_colors',
  'json',
  'jsonp',
  'format',
  'quality',
  'progressive',
  'strip_meta',
  'inline',
  'rasterize',
  'overlay',
  'rect',
  'text',
  'text_align',
  'font',
  'text_box'
])

const KNOWN_VIDEO_OPS = new Set(['size', 'quality', 'format', 'cut'])

const DIMS_RE = /^(\d+)?x(\d+)?$/

function maxOutputDimension(
  operations: readonly CdnOperation[]
): number | null {
  let max: number | null = null
  for (const op of operations) {
    if (!CORE_OPS.has(op.name)) continue
    const dims = op.params[0]?.match(DIMS_RE)
    if (!dims) continue
    for (const side of [dims[1], dims[2]]) {
      if (side != null) max = Math.max(max ?? 0, Number(side))
    }
  }
  return max
}

/**
 * Validates an operation chain against the documented CDN rules.
 * Pass `{ conversion: 'video' }` etc. to apply conversion-path rules instead
 * of image rules.
 * @example
 * ```ts
 * validateOperations([{ name: 'main_colors', params: [] }, { name: 'preview', params: [] }])
 * // → [{ severity: 'error', code: 'must-be-last', opIndex: 0, ... }]
 * ```
 */
export function validateOperations(
  operations: readonly CdnOperation[],
  context: ValidationContext = {}
): Diagnostic[] {
  return context.conversion === 'video'
    ? validateVideo(operations)
    : context.conversion != null
      ? []
      : validateImage(operations)
}

function validateImage(operations: readonly CdnOperation[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  const seen = new Set<string>()

  operations.forEach((op, index) => {
    const isLast = index === operations.length - 1

    if (MUST_BE_LAST.has(op.name) && !isLast) {
      diagnostics.push({
        severity: 'error',
        code: 'must-be-last',
        message: `Operation "${op.name}" must be the last in the chain`,
        opIndex: index
      })
    }

    if (seen.has(op.name) && !REPEATABLE.has(op.name)) {
      diagnostics.push({
        severity: 'warning',
        code: 'duplicate-operation',
        message: `Operation "${op.name}" appears multiple times; the CDN applies the last one`,
        opIndex: index
      })
    }
    seen.add(op.name)

    if (op.name === 'stretch') {
      const followedByResize = operations
        .slice(index + 1)
        .some((next) => next.name === 'resize' || next.name === 'scale_crop')
      if (!followedByResize) {
        diagnostics.push({
          severity: 'warning',
          code: 'stretch-without-resize',
          message:
            'stretch only affects a following resize/scale_crop operation',
          opIndex: index
        })
      }
    }

    if (!KNOWN_IMAGE_OPS.has(op.name) && !op.name.startsWith('@')) {
      diagnostics.push({
        severity: 'info',
        code: 'unknown-operation',
        message: `Unknown operation "${op.name}" (passed through as-is)`,
        opIndex: index
      })
    }
  })

  const hasCore = operations.some((op) => CORE_OPS.has(op.name))
  const hasProcessing = operations.some(
    (op) => KNOWN_IMAGE_OPS.has(op.name) && !INFO_OPS.has(op.name)
  )
  if (!hasCore && hasProcessing) {
    diagnostics.push({
      severity: 'warning',
      code: 'no-core-operation',
      message:
        'No core operation (preview, resize, smart_resize, scale_crop) — the CDN delivers the original file unprocessed'
    })
  }

  const maxDim = maxOutputDimension(operations)
  if (maxDim != null) {
    const isJpeg = operations.some(
      (op) => op.name === 'format' && op.params[0] === 'jpeg'
    )
    const limit = isJpeg ? 5000 : 3000
    if (maxDim > limit) {
      diagnostics.push({
        severity: 'error',
        code: 'dimensions-exceed-limit',
        message: `Output dimension ${maxDim}px exceeds the ${limit}px limit${
          isJpeg ? '' : ' (5000px is available with format/jpeg)'
        }`
      })
    }
  }

  return diagnostics
}

function validateVideo(operations: readonly CdnOperation[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  operations.forEach((op, index) => {
    const isLast = index === operations.length - 1
    const isThumbs = /^thumbs~\d+$/.test(op.name)

    if (isThumbs && !isLast) {
      diagnostics.push({
        severity: 'error',
        code: 'must-be-last',
        message: `Operation "${op.name}" must be the last in the chain`,
        opIndex: index
      })
    }

    if (op.name === 'size') {
      const dims = op.params[0]?.match(DIMS_RE)
      for (const side of [dims?.[1], dims?.[2]]) {
        if (side != null && Number(side) % 4 !== 0) {
          diagnostics.push({
            severity: 'error',
            code: 'video-size-not-divisible-by-4',
            message: `Video size dimension ${side} must be divisible by 4`,
            opIndex: index
          })
          break
        }
      }
    }

    if (
      !isThumbs &&
      !op.name.startsWith('@') &&
      !KNOWN_VIDEO_OPS.has(op.name)
    ) {
      diagnostics.push({
        severity: 'info',
        code: 'unknown-operation',
        message: `Unknown video operation "${op.name}" (passed through as-is)`,
        opIndex: index
      })
    }
  })

  return diagnostics
}

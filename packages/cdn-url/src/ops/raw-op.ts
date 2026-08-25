import type { CdnOperation } from '../types'

/**
 * Escape hatch: builds an arbitrary operation without any validation.
 * Useful for internal directives (`@clib`, `@finfo`) and operations the
 * library does not know about yet.
 *
 * @see https://uploadcare.com/docs/cdn-operations/
 * @example
 * ```ts
 * rawOp('@clib', 'my-lib', '1.0.0') // → -/@clib/my-lib/1.0.0/
 * ```
 */
export function rawOp(name: string, ...params: string[]): CdnOperation {
  return { name, params }
}

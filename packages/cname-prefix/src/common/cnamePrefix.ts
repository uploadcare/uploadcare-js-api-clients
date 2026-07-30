const CNAME_PREFIX_LEN = 10

/**
 * The CNAME prefix for a digest: its leading 10 digits written in base 36.
 *
 * `BigInt.prototype.toString(36)` does the conversion — a hand-rolled encoder
 * stood here until it was found to be a longer way of writing the same thing.
 */
export const cnamePrefix = (digest: bigint): string =>
  digest.toString(36).slice(0, CNAME_PREFIX_LEN)

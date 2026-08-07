import { addPrefixToCdnBase } from '../common/addPrefixToCdnBase'
import { cnamePrefix } from '../common/cnamePrefix'
import { sha256EncodeSync } from './sha256EncodeSync'

export { isPrefixedCdnBase } from '../common/isPrefixedCdnBase'

/**
 * The project's CNAME prefix, derived with Node's native SHA-256. Internal, so
 * that this entry publishes exactly what the browser entry does: the two are
 * the same module specifier, and an export that exists under only one condition
 * is an export that vanishes when the code moves.
 */
const getCnamePrefixSync = (publicKey: string): string =>
  cnamePrefix(sha256EncodeSync(publicKey))

/** The project's prefixed CDN base, derived with Node's native SHA-256. */
export const getPrefixedCdnBaseSync = (
  publicKey: string,
  cdnBase: string
): string => addPrefixToCdnBase(getCnamePrefixSync(publicKey), cdnBase)

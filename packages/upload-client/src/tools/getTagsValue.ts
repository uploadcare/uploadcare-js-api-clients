import { Tags } from '@uploadcare/api-client-utils'

/**
 * Serializes file tags into the comma-separated string the Upload API expects.
 * Arrays are joined; already-serialized strings are passed through; anything
 * else (including `undefined`) becomes `undefined` so it is omitted from the
 * request.
 */
export function getTagsValue(tags?: Tags | string): string | undefined {
  if (Array.isArray(tags)) {
    return tags.join(',')
  }
  return typeof tags === 'string' ? tags : undefined
}

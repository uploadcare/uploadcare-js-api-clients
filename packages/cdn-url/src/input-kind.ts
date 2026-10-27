import type {
  CdnUrlInput,
  FileUrlInput,
  GroupUrlInput,
  ProxyUrlInput
} from './types'

/**
 * Which kind of url a loose {@link CdnUrlInput} describes.
 *
 * One owner for a decision that used to have two: `serializeCdnUrl` tested
 * `'sourceUrl' in input && input.sourceUrl != null` while the builder tested
 * `'sourceUrl' in input`, so `{ uuid, sourceUrl: undefined }` serialized as a
 * file url through one and threw through the other. Presence of the *key* is not
 * intent — an explicitly `undefined` field means "not this kind".
 *
 * They are type predicates so callers narrow without an assertion.
 */
export const isProxyInput = (input: CdnUrlInput): input is ProxyUrlInput =>
  'sourceUrl' in input && input.sourceUrl != null

/** See {@link isProxyInput}. */
export const isGroupInput = (input: CdnUrlInput): input is GroupUrlInput =>
  'group' in input && input.group != null

/** See {@link isProxyInput}. */
export const isFileInput = (input: CdnUrlInput): input is FileUrlInput =>
  'uuid' in input && input.uuid != null

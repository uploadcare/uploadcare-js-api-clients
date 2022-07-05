import version from '../version'
import {
  getUserAgent as buildUserAgent,
  GetUserAgentOptions
} from '@uploadcare/api-client-utils'

const LIBRARY_NAME = 'UploadcareUploadClient'
const LIBRARY_VERSION = version

export function getUserAgent(
  options: Omit<GetUserAgentOptions, 'libraryName' | 'libraryVersion'>
) {
  return buildUserAgent({
    libraryName: LIBRARY_NAME,
    libraryVersion: LIBRARY_VERSION,
    ...options
  })
}

/**
 * Browser half of signed uploads: holds a token minted elsewhere and fetches a
 * new one before it expires. Nothing under `./client` touches the secret key,
 * or imports `node:crypto`, so this entry stays safe to ship to a browser.
 */

export {
  AuthTokenCache,
  type AuthTokenCacheOptions,
  type FetchAuthToken
} from './client/AuthTokenCache'
export { getAuthHeaders } from './client/getAuthHeaders'
export { getTokenExpiration } from './client/getTokenExpiration'

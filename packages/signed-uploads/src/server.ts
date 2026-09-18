/**
 * Node half of signed uploads: everything that needs the project secret key.
 * Never import this from browser code.
 */

export {
  generateSecureSignature,
  type GenerateSecureSignatureOptions
} from './server/generateSecureSignature'

export {
  generateAuthToken,
  type GenerateAuthTokenOptions,
  type AuthTokenExpiration,
  type AuthTokenRestrictions,
  type AuthTokenClaims
} from './server/generateAuthToken'

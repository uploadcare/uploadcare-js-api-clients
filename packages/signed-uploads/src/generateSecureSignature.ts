import { createHmac } from 'crypto'

export type GenerateSecureSignatureOptions =
  | {
      /**
       * The expiration timestamp of the signature in milliseconds since the
       * epoch or just Date object.
       */
      expire: number | Date
    }
  | {
      /** The lifetime of the signature in milliseconds */
      lifetime: number
    }

const msToUnixTimestamp = (ms: number) => Math.floor(ms / 1000).toString()
const getSecureExpire = (options: GenerateSecureSignatureOptions) => {
  if ('expire' in options) {
    return msToUnixTimestamp(new Date(options.expire).getTime())
  }

  return msToUnixTimestamp(Date.now() + options.lifetime)
}

/**
 * Generate a secure signature for signing the upload request to Uploadcare.
 *
 * @param secretKey - The secret key used to generate the signature.
 * @param options - Expiration options for the signature.
 * @see https://uploadcare.com/docs/security/secure-uploads/
 */
export const generateSecureSignature = (
  secret: string,
  options: GenerateSecureSignatureOptions
) => {
  const hmac = createHmac('sha256', secret)
  const secureExpire = getSecureExpire(options)
  hmac.update(secureExpire)
  const secureSignature = hmac.digest('hex')
  return { secureSignature, secureExpire }
}

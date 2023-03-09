import { createHmac } from 'crypto'

export type GenerateSecureSignatureOptions =
  | {
      /**
       * The expiration timestamp of the signature in milliseconds since the
       * epoch
       */
      expire: number
    }
  | {
      /** The lifetime of the signature in milliseconds */
      lifetime: number
    }

const msToUnixTimestamp = (ms: number) => Math.floor(ms / 1000)

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
  const expire =
    'expire' in options
      ? msToUnixTimestamp(new Date(options.expire).getTime())
      : msToUnixTimestamp(Date.now() + options.lifetime)

  const hmac = createHmac('sha256', secret)
  hmac.update(expire.toString())
  return hmac.digest('hex')
}

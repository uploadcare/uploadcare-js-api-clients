import { createHmac } from 'crypto'

export type GenerateSecureSignatureOptions =
  | {
      expire: number | Date
    }
  | {
      lifetime: number
    }

/**
 * Generate a secure signature for uploading a file to Uploadcare.
 * The signature is used for signing the upload request.
 * This is the simplest way to secure your upload API requests.
 * You can read more about this here:
 *
 * @see https://uploadcare.com/docs/security/secure-uploads/
 *
 * @param secretKey - The secret key used to generate the signature.
 * @param options - Additional options for the signature.
 * @param options.expire - The expiration timestamp of the signature.
 * @param options.lifetime - The lifetime of the signature.
 */
export const generateSecureSignature = (
  secret: string,
  options: GenerateSecureSignatureOptions
) => {
  const expire =
    'expire' in options
      ? new Date(options.expire).getTime()
      : Date.now() + options.lifetime

  const hmac = createHmac('sha256', secret)
  hmac.update(expire.toString())
  return hmac.digest('hex')
}

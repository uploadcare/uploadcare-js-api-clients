import { createHmac } from 'crypto'

export type GenerateSecureSignatureOptions =
  | {
      expire: number | Date
    }
  | {
      lifetime: number
    }

export const generateSecureSignature = (
  secret: string,
  options: GenerateSecureSignatureOptions
) => {
  if (typeof window !== 'undefined') {
    throw new Error(
      "Your shouldn't use `generateSecureSignature` in the browser! It's not secure!"
    )
  }
  const expire =
    'expire' in options
      ? new Date(options.expire).getTime()
      : Date.now() + options.lifetime

  const hmac = createHmac('sha256', secret)
  hmac.update(expire.toString())
  return hmac.digest('hex')
}

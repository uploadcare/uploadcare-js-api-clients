import { warnOnce } from '@uploadcare/api-client-utils'
import { AuthToken } from '../types'

type SecureOptions = {
  authToken?: AuthToken
  secureSignature?: string
  secureExpire?: string
}

/**
 * Returns the legacy signed-upload form fields. When `authToken` is also
 * provided, the Bearer header takes precedence and the signature params are
 * dropped — the server rejects requests carrying both auth schemes. Warns once
 * per process so the drop is not silent.
 */
export const getSecureParams = ({
  authToken,
  secureSignature,
  secureExpire
}: SecureOptions): { signature?: string; expire?: string } => {
  if (!authToken) {
    return { signature: secureSignature, expire: secureExpire }
  }
  if (secureSignature || secureExpire) {
    warnOnce(
      '[@uploadcare/upload-client] Both `authToken` and `secureSignature`/`secureExpire` are provided. ' +
        'These are mutually exclusive auth schemes; `authToken` takes precedence and the signature parameters are ignored.'
    )
  }
  return {}
}

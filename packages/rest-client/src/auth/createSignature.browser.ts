import { SignatureCreator } from './UploadcareAuthSchema'

export const createSignature: SignatureCreator = async (
  secretKey: string,
  signString: string
) => {
  const enc = new TextEncoder()
  const algorithm = { name: 'HMAC', hash: 'SHA-1' }
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secretKey),
    algorithm,
    false,
    ['sign', 'verify']
  )
  const hashBuffer = await crypto.subtle.sign(
    algorithm.name,
    key,
    enc.encode(signString)
  )
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

import crypto from 'crypto'
import { SignatureCreator } from './UploadcareAuthSchema'

export const createSignature: SignatureCreator = async (
  secretKey: string,
  signString: string
) => {
  return crypto.createHmac('sha1', secretKey).update(signString).digest('hex')
}

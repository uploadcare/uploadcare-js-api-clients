import { UploadcareAuthSchema } from '../src/auth/UploadcareAuthSchema'
import { UploadcareSimpleAuthSchema } from '../src/auth/UploadcareSimpleAuthSchema'
import crypto from 'crypto'

const DEMO_PUBLIC_KEY = 'demopublickey'
const DEMO_SECRET_KEY = 'demosecretkey'

const hmacSha1Hex = (key: string, text: string) => {
  return crypto.createHmac('sha1', key).update(text).digest('hex')
}

export const uploadcareSimpleAuthSchema = new UploadcareSimpleAuthSchema({
  publicKey: DEMO_PUBLIC_KEY,
  secretKey: DEMO_SECRET_KEY
})

export const uploadcareAuthSchema = new UploadcareAuthSchema({
  publicKey: DEMO_PUBLIC_KEY,
  signatureResolver: async (signString) => {
    return hmacSha1Hex(DEMO_SECRET_KEY, signString)
  }
})

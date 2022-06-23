import { createSignature } from '../src/auth/createSignature.node'
import { UploadcareAuthSchema } from '../src/auth/UploadcareAuthSchema'
import { UploadcareSimpleAuthSchema } from '../src/auth/UploadcareSimpleAuthSchema'
import { UserSettings } from '../src/settings'

export const DEMO_PUBLIC_KEY = 'demopublickey'
export const DEMO_SECRET_KEY = 'demosecretkey'

export const uploadcareSimpleAuthSchema = new UploadcareSimpleAuthSchema({
  publicKey: DEMO_PUBLIC_KEY,
  secretKey: DEMO_SECRET_KEY
})

export const uploadcareAuthSchema = new UploadcareAuthSchema({
  publicKey: DEMO_PUBLIC_KEY,
  signatureResolver: (signString) => {
    return createSignature(DEMO_SECRET_KEY, signString)
  }
})

export const testSettings: UserSettings = {
  authSchema: uploadcareAuthSchema
}

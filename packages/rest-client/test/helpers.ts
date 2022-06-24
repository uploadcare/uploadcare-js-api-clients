import { createSignature } from '../src/auth/createSignature.node'
import { UploadcareAuthSchema } from '../src/auth/UploadcareAuthSchema'
import { UploadcareSimpleAuthSchema } from '../src/auth/UploadcareSimpleAuthSchema'
import { UserSettings } from '../src/settings'

export const TEST_PUBLIC_KEY = process.env.REST_CLIENT_PUBLIC_KEY as string
export const TEST_SECRET_KEY = process.env.REST_CLIENT_SECRET_KEY as string

export const uploadcareSimpleAuthSchema = new UploadcareSimpleAuthSchema({
  publicKey: TEST_PUBLIC_KEY,
  secretKey: TEST_SECRET_KEY
})

export const uploadcareAuthSchema = new UploadcareAuthSchema({
  publicKey: TEST_PUBLIC_KEY,
  signatureResolver: (signString) => {
    return createSignature(TEST_SECRET_KEY, signString)
  }
})

export const testSettings: UserSettings = {
  authSchema: uploadcareAuthSchema
}

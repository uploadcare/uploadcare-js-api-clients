import { createSignature } from '../src/auth/createSignature.node'
import { UploadcareAuthSchema } from '../src/auth/UploadcareAuthSchema'
import { UploadcareSimpleAuthSchema } from '../src/auth/UploadcareSimpleAuthSchema'
import { UserSettings } from '../src/settings'
import { UploadClient } from '@uploadcare/upload-client'
import { listOfGroups } from '../src/api/group/listOfGroups'
import { deleteGroup } from '../src/api/group/deleteGroup'
import { getMetadata } from '../src/api/metadata/getMetadata'
import { METADATA_UUID } from './fixtures'
import { deleteMetadata } from '../src/api/metadata/deleteMetadata'
import { delay } from '@uploadcare/api-client-utils'

export const TEST_PUBLIC_KEY = process.env
  .REST_CLIENT_DEFAULT_PUBLIC_KEY as string
export const TEST_SECRET_KEY = process.env
  .REST_CLIENT_DEFAULT_SECRET_KEY as string

/**
 * When we create something (groups/metadata), it won't be available through the API immediately
 * So we need to wait a few seconds to use it in the tests
 */
export const waitForApiFlush = () => delay(2000)

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

// TODO: apiBaseURL should be synced with baseCDN of upload client (i.e. same env)
export const testSettings: UserSettings = {
  authSchema: uploadcareAuthSchema,
  apiBaseURL: 'https://api.uploadcare.com/'
}

export const uploadClient = new UploadClient({
  publicKey: TEST_PUBLIC_KEY,
  baseCDN: 'https://ucarecdn.com'
})

export const resetGroups = async () => {
  try {
    const groups = await listOfGroups({}, testSettings)
    // TODO: iteration will be over first page, need to implement generator/iterator for pagination results
    await Promise.allSettled(
      groups.results.map((group) =>
        deleteGroup({ uuid: group.id }, testSettings)
      )
    )
  } catch (err) {
    return
  }
}

export const resetMetadata = async () => {
  try {
    const metadata = await getMetadata({ uuid: METADATA_UUID }, testSettings)
    await Promise.allSettled(
      Object.keys(metadata).map((key) =>
        deleteMetadata({ uuid: METADATA_UUID, key }, testSettings)
      )
    )
  } catch (err) {
    return
  }
}

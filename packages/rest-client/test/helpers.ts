import { delay } from '@uploadcare/api-client-utils'
import { UploadClient } from '@uploadcare/upload-client'
import { deleteGroup } from '../src/api/group/deleteGroup'
import { listOfGroups } from '../src/api/group/listOfGroups'
import { deleteMetadata } from '../src/api/metadata/deleteMetadata'
import { getMetadata } from '../src/api/metadata/getMetadata'
import { deleteWebhook } from '../src/api/webhooks/deleteWebhook'
import { listOfWebhooks } from '../src/api/webhooks/listOfWebhooks'
import { createSignature } from '../src/auth/createSignature.node'
import { UploadcareAuthSchema } from '../src/auth/UploadcareAuthSchema'
import { UploadcareSimpleAuthSchema } from '../src/auth/UploadcareSimpleAuthSchema'
import { UserSettings } from '../src/settings'
import { METADATA_UUID } from './fixtures'

export const TEST_PUBLIC_KEY = process.env
  .REST_CLIENT_DEFAULT_PUBLIC_KEY as string
export const TEST_SECRET_KEY = process.env
  .REST_CLIENT_DEFAULT_SECRET_KEY as string

/**
 * When we create something (groups/metadata), it won't be available through the
 * API immediately So we need to wait a few seconds to use it in the tests
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

export const randomTargetUrl = () => {
  const id = Math.floor(Math.random() * 1000)
  return `https://ucarecdn.com/?id=${id}`
}

export const resetGroups = async () => {
  const groups = await listOfGroups({}, testSettings)
  // TODO: iteration will be over first page, need to implement generator/iterator for pagination results
  await Promise.all(
    groups.results.map((group) => deleteGroup({ uuid: group.id }, testSettings))
  )
}

export const resetMetadata = async () => {
  const metadata = await getMetadata({ uuid: METADATA_UUID }, testSettings)
  await Promise.all(
    Object.keys(metadata).map((key) =>
      deleteMetadata({ uuid: METADATA_UUID, key }, testSettings)
    )
  )
}

export const resetWebhooks = async () => {
  const webhooks = await listOfWebhooks({}, testSettings)
  await Promise.all(
    webhooks.map((webhook) =>
      deleteWebhook({ targetUrl: webhook.targetUrl }, testSettings)
    )
  )
}

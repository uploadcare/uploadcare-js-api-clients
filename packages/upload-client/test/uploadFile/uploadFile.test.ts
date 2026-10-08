import { expect, vi, describe, it } from 'vitest'
import { resetSession } from '@uploadcare/api-emulator'
import { uploadFile } from '../../src/uploadFile/uploadFile'
import * as factory from '../_fixtureFactory'
import { assertUploadedFile, getSettingsForTesting } from '../_helpers'

vi.setConfig({ testTimeout: 60000 })

/**
 * Answers 500 on the other strategies' endpoints, so a test passes only through
 * the strategy it names. A no-op against the real API.
 */
const refuseRoutes = (...routes: string[]) => {
  const session = resetSession()
  for (const route of routes)
    session.on(route, () => new Response('', { status: 500 }))
}

describe('uploadFile', () => {
  it('should upload small files using `uploadDirect`', async () => {
    refuseRoutes('POST /multipart/start/', 'POST /from_url/')
    const fileToUpload = factory.image('blackSquare').data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })

    const file = await uploadFile(fileToUpload, settings)
    assertUploadedFile(file, settings)
  })

  it('should upload big files using `uploadMultipart`', async () => {
    refuseRoutes('POST /base/', 'POST /from_url/')
    const fileToUpload = factory.file(12).data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('multipart')
    })

    const file = await uploadFile(fileToUpload, settings)
    assertUploadedFile(file, settings)
  })

  it('should upload urls using `uploadFromUrl`', async () => {
    refuseRoutes('POST /base/', 'POST /multipart/start/')
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })

    const file = await uploadFile(sourceUrl, settings)
    assertUploadedFile(file, settings)
  })

  it('should upload uuids using `uploadFromUploaded`', async () => {
    refuseRoutes('POST /base/', 'POST /multipart/start/', 'POST /from_url/')
    const uuid = factory.uuid('image')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })

    const file = await uploadFile(uuid, settings)
    expect(file.uuid).toBe(uuid)
    assertUploadedFile(file, settings)
  })
})

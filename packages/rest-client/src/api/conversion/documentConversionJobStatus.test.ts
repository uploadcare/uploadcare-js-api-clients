import { describe, it } from '@jest/globals'
import { documentConversionJobStatus } from './documentConversionJobStatus'

import { DOCUMENT_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'
import { ConversionStatus } from '../../types/ConversionStatus'
import { convertDocument } from './convertDocument'

describe('documentConversionJobStatus', () => {
  it('should work', async () => {
    const { result } = await convertDocument(
      {
        paths: [`${DOCUMENT_UUID}/document/-/format/docx/`],
        store: 'false'
      },
      testSettings
    )

    const { token } = result[0]
    const response = await documentConversionJobStatus(
      {
        token
      },
      testSettings
    )
    expect(response.status).toBeOneOf([
      ConversionStatus.PENDING,
      ConversionStatus.PROCESSING,
      ConversionStatus.FINISHED,
      ConversionStatus.FAILED
    ])
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      documentConversionJobStatus(
        {
          token: 1
        },
        testSettings
      )
    ).rejects.toThrowError()
  })
})

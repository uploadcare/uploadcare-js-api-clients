import { describe, it } from '@jest/globals'
import { conversionJobStatus } from './conversionJobStatus'

import 'jest-extended'
import { DOCUMENT_UUID, VIDEO_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'
import { ConversionStatus } from '../../types/ConversionStatus'
import { convert } from './convert'
import { ConversionType } from '../../types/ConversionType'

describe('conversionJobStatus', () => {
  it('should work with document conversion', async () => {
    const { result } = await convert(
      {
        type: ConversionType.VIDEO,
        paths: [`${VIDEO_UUID}/video/-/format/mp4/`],
        store: false
      },
      testSettings
    )

    const { token } = result[0]
    const response = await conversionJobStatus(
      {
        type: ConversionType.VIDEO,
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

  it('should work with document conversion', async () => {
    const { result } = await convert(
      {
        type: ConversionType.DOCUMENT,
        paths: [`${DOCUMENT_UUID}/document/-/format/pdf/`],
        store: false
      },
      testSettings
    )

    const { token } = result[0]
    const response = await conversionJobStatus(
      {
        type: ConversionType.DOCUMENT,
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
      conversionJobStatus(
        {
          type: ConversionType.VIDEO,
          token: 1
        },
        testSettings
      )
    ).rejects.toThrowError()
  })
})

import { describe, it } from '@jest/globals'
import { videoConversionJobStatus } from './videoConversionJobStatus'

import 'jest-extended'
import { VIDEO_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'
import { ConversionStatus } from '../../types/ConversionStatus'
import { convertVideo } from './convertVideo'

describe('videoConversionJobStatus', () => {
  it('should work', async () => {
    const { result } = await convertVideo(
      {
        paths: [`${VIDEO_UUID}/video/-/format/mp4/`],
        store: false
      },
      testSettings
    )

    const { token } = result[0]
    const response = await videoConversionJobStatus(
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
      videoConversionJobStatus(
        {
          token: 1
        },
        testSettings
      )
    ).rejects.toThrowError()
  })
})

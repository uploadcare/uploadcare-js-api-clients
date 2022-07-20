import { describe, it } from '@jest/globals'
import { videoConversionJobStatus } from './videoConversionJobStatus'

import { VIDEO_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'
import { ConversionStatus } from '../../types/ConversionStatus'
import { copyFileToLocalStorage } from '../file/copyFileToLocalStorage'
import { convertVideo } from './convertVideo'
import { delay } from '@uploadcare/api-client-utils'

describe('videoConversionJobStatus', () => {
  it('should work', async () => {
    const copy = await copyFileToLocalStorage(
      { source: VIDEO_UUID, store: false },
      testSettings
    )

    const { result } = await convertVideo(
      {
        paths: [`${copy.result.uuid}/video/-/format/mp4/`],
        store: 'false'
      },
      testSettings
    )

    const { token } = result[0]
    await delay(1000)
    const response = await videoConversionJobStatus(
      {
        token
      },
      testSettings
    )
    expect(
      [
        ConversionStatus.PENDING,
        ConversionStatus.PROCESSING,
        ConversionStatus.FINISHED
      ].includes(response.status)
    ).toBeTruthy()
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

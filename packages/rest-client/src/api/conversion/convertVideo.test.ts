import { describe, it } from '@jest/globals'
import { convertVideo } from './convertVideo'

import { testSettings } from '../../../test/helpers'
import { VIDEO_UUID } from '../../../test/fixtures'

describe('convertVideo', () => {
  it('should work', async () => {
    const response = await convertVideo(
      {
        paths: [`${VIDEO_UUID}/video/-/format/mp4/`, 'invalid'],
        store: 'false'
      },
      testSettings
    )
    expect(response.problems['invalid']).toBeTruthy()

    expect(response.result.length).toBe(1)
    expect(response.result[0].originalSource).toBe(
      `${VIDEO_UUID}/video/-/format/mp4/`
    )
    expect(response.result[0].token).toBeTruthy()
    expect(response.result[0].uuid).toBeTruthy()
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      convertVideo(
        {
          paths: []
        },
        testSettings
      )
    ).rejects.toThrowError()
  })
})

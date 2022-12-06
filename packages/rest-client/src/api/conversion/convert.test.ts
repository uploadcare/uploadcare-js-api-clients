import { describe, it } from '@jest/globals'
import { convert } from './convert'

import { testSettings } from '../../../test/helpers'
import { DOCUMENT_UUID, VIDEO_UUID } from '../../../test/fixtures'
import { ConversionType } from '../../types/ConversionType'

describe('convert', () => {
  it('should work with video conversion', async () => {
    const response = await convert(
      {
        type: ConversionType.VIDEO,
        paths: [`${VIDEO_UUID}/video/-/format/mp4/`, 'invalid'],
        store: false
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

  it('should work with document conversion', async () => {
    const response = await convert(
      {
        type: ConversionType.DOCUMENT,
        paths: [`${DOCUMENT_UUID}/document/-/format/pdf/`, 'invalid'],
        store: false
      },
      testSettings
    )
    expect(response.problems['invalid']).toBeTruthy()

    expect(response.result.length).toBe(1)
    expect(response.result[0].originalSource).toBe(
      `${DOCUMENT_UUID}/document/-/format/pdf/`
    )
    expect(response.result[0].token).toBeTruthy()
    expect(response.result[0].uuid).toBeTruthy()
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      convert(
        {
          type: ConversionType.VIDEO,
          paths: []
        },
        testSettings
      )
    ).rejects.toThrowError()
  })
})

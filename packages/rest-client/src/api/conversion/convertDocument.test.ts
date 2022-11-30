import { describe, it } from '@jest/globals'
import { convertDocument } from './convertDocument'

import { testSettings } from '../../../test/helpers'
import { DOCUMENT_UUID } from '../../../test/fixtures'

describe('convertDocument', () => {
  it('should work', async () => {
    const response = await convertDocument(
      {
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
      convertDocument(
        {
          paths: []
        },
        testSettings
      )
    ).rejects.toThrowError()
  })
})

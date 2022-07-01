import { describe, it } from '@jest/globals'
import { addonExecutionStatus } from './addonExecutionStatus'

import { testSettings } from '../../../test/helpers'
import { AddonName } from '../../types/AddonName'

describe.skip('addonExecutionStatus', () => {
  it('should work', async () => {
    const response = await addonExecutionStatus(
      {
        addonName: AddonName.UC_CLAMAV_VIRUS_SCAN,
        requestId: 'requestId'
      },
      testSettings
    )
    expect(response.status).toBeTruthy()
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      addonExecutionStatus(
        {
          addonName: 'invalid' as AddonName,
          requestId: 'invalid'
        },
        testSettings
      )
    ).rejects.toThrowError()
  })
})

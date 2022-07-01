import { describe, it } from '@jest/globals'
import { addonExecutionStatus } from './addonExecutionStatus'

import { testSettings } from '../../../test/helpers'
import { AddonName } from '../../types/AddonName'

// TODO: isn't enable for the project
describe.skip('addonExecutionStatus', () => {
  it('should work', async () => {
    const response = await addonExecutionStatus(
      {
        addonName: 'uc_clamav_virus_scan',
        requestId: 'uc_clamav_virus_scan'
      },
      testSettings
    )
    expect(response.requestId).toBeTruthy()
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

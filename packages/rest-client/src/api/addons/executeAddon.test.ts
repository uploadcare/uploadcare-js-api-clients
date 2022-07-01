import { describe, it } from '@jest/globals'
import { executeAddon } from './executeAddon'

import { testSettings } from '../../../test/helpers'
import { AddonName } from '../../types/AddonName'

// TODO: isn't enable for the project
describe.skip('executeAddon', () => {
  it('should work', async () => {
    const response = await executeAddon(
      {
        addonName: 'uc_clamav_virus_scan'
      },
      testSettings
    )
    expect(response.requestId).toBeTruthy()
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      executeAddon(
        {
          addonName: 'invalid' as AddonName
        },
        testSettings
      )
    ).rejects.toThrowError()
  })
})

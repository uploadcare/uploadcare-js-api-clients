import { describe, it } from 'vitest'
import { executeAddon } from './executeAddon'

import { testSettings } from '../../../test/helpers'
import { AddonName } from '../../types/AddonName'
import { ADDONS_UUID } from '../../../test/fixtures'
import { copyFileToLocalStorage } from '../file/copyFileToLocalStorage'

describe('executeAddon', () => {
  it('should work', async () => {
    const copy = await copyFileToLocalStorage(
      { source: ADDONS_UUID, store: false },
      testSettings
    )

    const response = await executeAddon(
      {
        addonName: AddonName.UC_CLAMAV_VIRUS_SCAN,
        target: copy.result.uuid,
        params: {
          purge_infected: false
        }
      },
      testSettings
    )
    expect(response.requestId).toBeTruthy()
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      executeAddon(
        {
          addonName: 'invalid' as AddonName,
          target: ADDONS_UUID
        },
        testSettings
      )
    ).rejects.toThrowError()
  })
})

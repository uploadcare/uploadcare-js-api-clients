import { jest } from '@jest/globals'
import { ADDONS_UUID } from '../../test/fixtures'
import { testSettings } from '../../test/helpers'
import { copyFileToLocalStorage } from '../api/file/copyFileToLocalStorage'
import { AddonName } from '../types/AddonName'
import { addonJobPoller } from './addonJobPoller'

jest.setTimeout(60 * 1000)

describe('addonJobPoller', () => {
  it('should work', async () => {
    const copy = await copyFileToLocalStorage(
      { source: ADDONS_UUID, store: false },
      testSettings
    )

    const result = await addonJobPoller(
      {
        addonName: AddonName.UC_CLAMAV_VIRUS_SCAN,
        target: copy.result.uuid,
        params: {
          purge_infected: false
        }
      },
      testSettings
    )

    expect(result.error).toBeFalse()
    expect(result.result?.data).toBeTruthy()
  })
})

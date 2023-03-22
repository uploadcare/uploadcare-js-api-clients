import { jest } from '@jest/globals'
import { ADDONS_UUID } from '../../test/fixtures'
import { testSettings } from '../../test/helpers'
import { copyFileToLocalStorage } from '../api/file/copyFileToLocalStorage'
import { AddonExecutionStatus } from '../types/AddonExecutionStatus'
import { AddonName } from '../types/AddonName'
import { addonJobPoller } from './addonJobPoller'

jest.setTimeout(80 * 1000)

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

  it('should accept onRun and onStatus callbacks', async () => {
    const copy = await copyFileToLocalStorage(
      { source: ADDONS_UUID, store: false },
      testSettings
    )

    const onRun = jest.fn()
    const onStatus = jest.fn()

    await addonJobPoller(
      {
        addonName: AddonName.UC_CLAMAV_VIRUS_SCAN,
        onRun,
        onStatus,
        target: copy.result.uuid,
        params: {
          purge_infected: false
        }
      },
      testSettings
    )

    expect(onRun.mock.calls.length).toBe(1)
    expect(onRun.mock.calls[0]).toEqual([
      expect.objectContaining({
        requestId: expect.toBeString()
      })
    ])
    expect(onStatus.mock.calls.length).toBeGreaterThanOrEqual(1)
    expect(onStatus.mock.lastCall).toEqual([
      expect.objectContaining({
        status: AddonExecutionStatus.DONE
      })
    ])
  })
})

import { describe, it } from '@jest/globals'
import { addonExecutionStatus } from './addonExecutionStatus'

import { testSettings } from '../../../test/helpers'
import { AddonName } from '../../types/AddonName'
import { executeAddon } from './executeAddon'
import { ADDONS_UUID } from '../../../test/fixtures'
import { copyFileToLocalStorage } from '../file/copyFileToLocalStorage'

describe('addonExecutionStatus', () => {
  it('should work', async () => {
    const copy = await copyFileToLocalStorage(
      { source: ADDONS_UUID, store: false },
      testSettings
    )
    const { requestId } = await executeAddon(
      {
        addonName: AddonName.AWS_REKOGNITION_DETECT_LABELS,
        target: copy.result.uuid
      },
      testSettings
    )
    const response = await addonExecutionStatus(
      {
        addonName: AddonName.AWS_REKOGNITION_DETECT_LABELS,
        requestId: requestId
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

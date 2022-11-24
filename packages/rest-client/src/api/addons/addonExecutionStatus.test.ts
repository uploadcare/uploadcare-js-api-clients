import { describe, it } from '@jest/globals'
import { addonExecutionStatus } from './addonExecutionStatus'

import { ADDONS_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'
import { AddonName } from '../../types/AddonName'
import { executeAddon } from './executeAddon'
import { AddonExecutionStatus } from '../../types/AddonExecutionStatus'

describe('addonExecutionStatus', () => {
  it('should work', async () => {
    const { requestId } = await executeAddon(
      {
        addonName: AddonName.AWS_REKOGNITION_DETECT_LABELS,
        target: ADDONS_UUID
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
    expect(response.status).toBeOneOf([
      AddonExecutionStatus.DONE,
      AddonExecutionStatus.ERROR,
      AddonExecutionStatus.IN_PROGRESS,
      AddonExecutionStatus.UNKNOWN
    ])
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

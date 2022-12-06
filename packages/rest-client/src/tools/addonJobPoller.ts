import {
  addonExecutionStatus,
  AddonExecutionStatusResponse
} from '../api/addons/addonExecutionStatus'
import {
  executeAddon,
  ExecuteAddonOptions,
  ExecuteAddonResponse
} from '../api/addons/executeAddon'
import { fileInfo } from '../api/file/fileInfo'
import { ApiRequestSettings } from '../makeApiRequest'
import { AddonExecutionStatus } from '../types/AddonExecutionStatus'
import { AddonName } from '../types/AddonName'
import { AppData } from '../types/AppData'
import { ValueOf } from '../types/ValueOf'
import { createJobPoller, CreateJobPollerPollOptions } from './createJobPoller'

export type AddonJobPollerOptions = {
  onRun?: (response: ExecuteAddonResponse) => void
  onStatus?: (response: AddonExecutionStatusResponse) => void
}

export const addonJobPoller = async <T extends ValueOf<typeof AddonName>>(
  options: ExecuteAddonOptions<T> &
    CreateJobPollerPollOptions &
    AddonJobPollerOptions,
  settings: ApiRequestSettings
) => {
  const { onRun, onStatus, ...pollerOptions } = options

  const poller = createJobPoller({
    runner: executeAddon,
    resolveJobs: (response, runnerOptions, runnerSettings) => {
      onRun && onRun(response)
      return [
        {
          target: runnerOptions.target,
          requestId: response.requestId,
          addonName: runnerOptions.addonName,
          runnerSettings
        }
      ]
    },
    getJobStatus: async (job) => {
      const response = await addonExecutionStatus(
        {
          addonName: job.addonName,
          requestId: job.requestId
        },
        job.runnerSettings
      )
      onStatus && onStatus(response)
      return response
    },
    isJobFinished: (statusResponse) =>
      statusResponse.status === AddonExecutionStatus.DONE,
    isJobFailed: (statusResponse) =>
      statusResponse.status === AddonExecutionStatus.ERROR,
    getResult: async (job) => {
      const info = await fileInfo(
        { uuid: job.target, include: 'appdata' },
        job.runnerSettings
      )
      const appdata = info.appdata as AppData
      const addonData = appdata[job.addonName] as NonNullable<AppData[T]>
      return {
        error: false as const,
        result: addonData
      }
    },
    getError: async () => ({
      error: true as const,
      result: null
    })
  })
  const promises = await poller(pollerOptions, settings)
  return promises[0]
}

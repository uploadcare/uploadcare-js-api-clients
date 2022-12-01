import { addonExecutionStatus } from '../api/addons/addonExecutionStatus'
import { executeAddon, ExecuteAddonOptions } from '../api/addons/executeAddon'
import { fileInfo } from '../api/file/fileInfo'
import { ApiRequestSettings } from '../makeApiRequest'
import { AddonExecutionStatus } from '../types/AddonExecutionStatus'
import { AddonName } from '../types/AddonName'
import { AppData } from '../types/AppData'
import { ValueOf } from '../types/ValueOf'
import { createJobPoller, CreateJobPollerPollOptions } from './createJobPoller'

export const addonJobPoller = async <T extends ValueOf<typeof AddonName>>(
  options: ExecuteAddonOptions<T> & CreateJobPollerPollOptions,
  settings: ApiRequestSettings
) => {
  const poller = createJobPoller({
    runner: executeAddon,
    resolveJobs: (response, runnerOptions, runnerSettings) => [
      {
        target: runnerOptions.target,
        requestId: response.requestId,
        addonName: runnerOptions.addonName,
        runnerSettings
      }
    ],
    getJobStatus: (job) => {
      return addonExecutionStatus(
        {
          addonName: job.addonName,
          requestId: job.requestId
        },
        job.runnerSettings
      )
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
  const promises = await poller(options, settings)
  return promises[0]
}

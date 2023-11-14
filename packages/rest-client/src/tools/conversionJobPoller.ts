import { conversionJobStatus } from '../api/conversion/conversionJobStatus'
import { convert } from '../api/conversion/convert'
import { ApiRequestSettings } from '../makeApiRequest'
import { ConversionOptions } from '../types/ConversionOptions'
import { ConversionResponse } from '../types/ConversionResponse'
import { ConversionResult } from '../types/ConversionResult'
import { ConversionStatus } from '../types/ConversionStatus'
import { ConversionStatusResponse } from '../types/ConversionStatusResponse'
import { ConversionStatusResult } from '../types/ConversionStatusResult'
import { ConversionType } from '../types/ConversionType'
import { ValueOf } from '../types/ValueOf'
import { createJobPoller, CreateJobPollerPollOptions } from './createJobPoller'

export type ConversionJobPollerOptions<
  T extends ValueOf<typeof ConversionType>
> = {
  onRun?: (response: ConversionResponse<ConversionResult[T]>) => void
  onStatus?: (
    response: ConversionStatusResponse<ConversionStatusResult[T]>
  ) => void
}

export const conversionJobPoller = <T extends ValueOf<typeof ConversionType>>(
  options: ConversionOptions<T> &
    CreateJobPollerPollOptions &
    ConversionJobPollerOptions<T>,
  settings: ApiRequestSettings
) => {
  const { onRun, onStatus, ...rest } = options

  const pollerOptions = rest as ConversionOptions<T> &
    CreateJobPollerPollOptions

  const poller = createJobPoller({
    runner: convert<T>,
    resolveJobs: (response, runnerOptions, runnerSettings) => {
      onRun && onRun(response as ConversionResponse<ConversionResult[T]>)
      return runnerOptions.paths.map((path) => {
        const problem = response.problems[path]
        if (problem) {
          return {
            hasProblem: true as const,
            type: runnerOptions.type,
            path,
            problem,
            runnerSettings
          }
        }
        const result = response.result.find(
          (r) => r.originalSource === path
        ) as ConversionResult[T]
        return {
          hasProblem: false as const,
          type: runnerOptions.type,
          path,
          token: result.token,
          result,
          runnerSettings
        }
      })
    },
    getJobStatus: async (job) => {
      let status: { path: string } & ConversionStatusResponse<
        ConversionStatusResult[T]
      >

      if (job.hasProblem) {
        status = {
          path: job.path,
          status: ConversionStatus.FAILED,
          error: job.problem,
          result: null
        }
      } else {
        const statusResponse = await conversionJobStatus(
          { type: job.type, token: job.token },
          job.runnerSettings
        )
        status = {
          path: job.path,
          ...statusResponse
        } as { path: string } & ConversionStatusResponse<
          ConversionStatusResult[T]
        >
      }
      onStatus && onStatus(status)
      return status
    },
    isJobFinished: (statusResponse) =>
      statusResponse.status === ConversionStatus.FINISHED,
    isJobFailed: (statusResponse) =>
      statusResponse.status === ConversionStatus.FAILED ||
      statusResponse.status === ConversionStatus.CANCELLED,
    getResult: async (job, statusResponse) => statusResponse,
    getError: async (job, statusResponse) => statusResponse
  })

  return poller(pollerOptions, settings)
}

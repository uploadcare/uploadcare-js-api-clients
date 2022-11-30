import { conversionJobStatus } from '../api/conversion/conversionJobStatus'
import { convert } from '../api/conversion/convert'
import { ApiRequestSettings } from '../makeApiRequest'
import { ConversionOptions } from '../types/ConversionOptions'
import { ConversionResult } from '../types/ConversionResult'
import { ConversionStatus } from '../types/ConversionStatus'
import { ConversionStatusResponse } from '../types/ConversionStatusResponse'
import { ConversionStatusResult } from '../types/ConversionStatusResult'
import { ConversionType } from '../types/ConversionType'
import { ValueOf } from '../types/ValueOf'
import { createJobPoller } from './createJobPoller'

export const conversionJobPoller = async <
  T extends ValueOf<typeof ConversionType>
>(
  options: ConversionOptions<T>,
  settings: ApiRequestSettings
) => {
  const poller = createJobPoller({
    runner: convert,
    resolveJobs: (response, runnerOptions, runnerSettings) => {
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
    getJobStatus: (job) => {
      if (job.hasProblem) {
        return {
          path: job.path,
          status: ConversionStatus.FAILED,
          error: job.problem
        } as { path: string } & ConversionStatusResponse<
          ConversionStatusResult[T]
        >
      }
      return conversionJobStatus(
        { type: job.type, token: job.token },
        job.runnerSettings
      )
    },
    isJobFinished: (statusResponse) =>
      statusResponse.status === ConversionStatus.FINISHED,
    isJobFailed: (statusResponse) =>
      statusResponse.status === ConversionStatus.FAILED ||
      statusResponse.status === ConversionStatus.CANCELLED,
    getResult: async (job, statusResponse) =>
      ({
        path: job.path,
        ...statusResponse
      } as { path: string } & ConversionStatusResponse<
        ConversionStatusResult[T]
      >),
    getError: async (job, statusResponse) =>
      ({
        path: job.path,
        ...statusResponse
      } as { path: string } & ConversionStatusResponse<
        ConversionStatusResult[T]
      >)
  })

  return poller(options, settings)
}

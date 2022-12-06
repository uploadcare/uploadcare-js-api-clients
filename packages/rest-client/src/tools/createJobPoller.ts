import { CancelError, poll } from '@uploadcare/api-client-utils'

export type CrateJobPollerRunner<Options, Settings, ReturnType> = (
  options: Options,
  settings: Settings
) => ReturnType
type CreateJobPollerJobResolver<
  RunnerReturnType,
  JobType,
  RunnerOptions,
  RunnerSettings
> = (
  response: Awaited<RunnerReturnType>,
  runnerOptions: RunnerOptions,
  runnerSettings: RunnerSettings
) => JobType[]
export type CreateJobPollerStatusChecker<StatusReturnType, JobType> = (
  job: JobType
) => StatusReturnType
type CreateJobPollerIsJobFinished<StatusResponse> = (
  statusResponse: StatusResponse
) => boolean
type CreateJobPollerIsJobFailed<StatusResponse> = (
  statusResponse: StatusResponse
) => boolean
type CreateJobPollerResultGetter<JobType, StatusResponse, ResultType> = (
  job: JobType,
  statusResponse: StatusResponse
) => Promise<ResultType>
type CreateJobPollerErrorGetter<JobType, StatusResponse, ErrorType> = (
  job: JobType,
  statusResponse: StatusResponse
) => Promise<ErrorType>

type CrateJobPollerOptions<
  RunnerOptions,
  RunnerSettings,
  RunnerReturnType,
  StatusReturnType,
  JobType,
  ResultType,
  ErrorType
> = {
  runner: CrateJobPollerRunner<RunnerOptions, RunnerSettings, RunnerReturnType>
  resolveJobs: CreateJobPollerJobResolver<
    RunnerReturnType,
    JobType,
    RunnerOptions,
    RunnerSettings
  >
  getJobStatus: CreateJobPollerStatusChecker<StatusReturnType, JobType>
  isJobFinished: CreateJobPollerIsJobFinished<Awaited<StatusReturnType>>
  isJobFailed: CreateJobPollerIsJobFailed<Awaited<StatusReturnType>>
  getResult: CreateJobPollerResultGetter<
    JobType,
    Awaited<StatusReturnType>,
    ResultType
  >
  getError: CreateJobPollerErrorGetter<
    JobType,
    Awaited<StatusReturnType>,
    ErrorType
  >
}

export type CreateJobPollerPollOptions = {
  pollOptions?: {
    signal?: AbortSignal
    interval?: number
    timeout?: number
  }
}

type CreatePollStrategyOptions<StatusReturnType, JobType> = {
  getJobStatus: CreateJobPollerStatusChecker<StatusReturnType, JobType>
  job: JobType
  isJobFailed: CreateJobPollerIsJobFailed<Awaited<StatusReturnType>>
  isJobFinished: CreateJobPollerIsJobFailed<Awaited<StatusReturnType>>
}

enum PollStrategyJobStatus {
  FINISHED,
  FAILED
}

type PollStrategyReturnType<StatusReturnType> = {
  status: PollStrategyJobStatus
  statusResponse: StatusReturnType
}
type PollStrategy<StatusResponse> = () => Promise<
  PollStrategyReturnType<StatusResponse> | false
>

function createPollStrategy<StatusReturnType, JobType>({
  getJobStatus,
  job,
  isJobFailed,
  isJobFinished
}: CreatePollStrategyOptions<StatusReturnType, JobType>): PollStrategy<
  Awaited<StatusReturnType>
> {
  return async () => {
    const statusResponse = await getJobStatus(job)
    if (isJobFinished(statusResponse)) {
      return { status: PollStrategyJobStatus.FINISHED, statusResponse }
    } else if (isJobFailed(statusResponse)) {
      return { status: PollStrategyJobStatus.FAILED, statusResponse }
    }
    return false
  }
}

export function createJobPoller<
  RunnerOptions,
  RunnerSettings,
  RunnerReturnType,
  StatusReturnType,
  JobType,
  ResultType,
  ErrorType
>(
  options: CrateJobPollerOptions<
    RunnerOptions,
    RunnerSettings,
    RunnerReturnType,
    StatusReturnType,
    JobType,
    ResultType,
    ErrorType
  >
) {
  const {
    runner,
    resolveJobs,
    getJobStatus,
    isJobFinished,
    isJobFailed,
    getResult,
    getError
  } = options

  return async (
    options: RunnerOptions & CreateJobPollerPollOptions,
    runnerSettings: RunnerSettings
  ) => {
    // TODO: add default timeout and inerval
    const { pollOptions, ...runnerOptions } = options

    const response = await runner(
      runnerOptions as RunnerOptions,
      runnerSettings
    )
    const jobs = resolveJobs(
      response,
      runnerOptions as RunnerOptions,
      runnerSettings
    )

    if (pollOptions?.signal?.aborted) {
      throw new CancelError()
    }

    const promises = jobs.map(async (job) => {
      const pollStrategy = createPollStrategy({
        getJobStatus,
        job,
        isJobFailed,
        isJobFinished
      })
      const pollResult = await poll({
        check: pollStrategy,
        signal: pollOptions?.signal,
        interval: pollOptions?.interval,
        timeout: pollOptions?.timeout
      })
      if (pollResult.status === PollStrategyJobStatus.FINISHED) {
        const result = await getResult(job, pollResult.statusResponse)
        return result
      }
      const error = await getError(job, pollResult.statusResponse)
      return error
    })

    return promises
  }
}

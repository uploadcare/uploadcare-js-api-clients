import { SettingsInterface } from "./types"
import poll, { PollPromiseInterface } from "./tools/poll"
import fromUrlStatus, {
  FromUrlStatusResponse,
  isSuccessResponse
} from "./api/fromUrlStatus"
import { Uuid } from "./api/types"
import defaultSettings from "./defaultSettings"

type FileIsUploadedParams = {
  token: Uuid
  timeout?: number
  onProgress?: Function
  settings?: SettingsInterface
}

const checkFileIsUploadedFromUrl = ({
  token,
  timeout = defaultSettings.pollingTimeoutMilliseconds,
  onProgress,
  settings = {}
}: FileIsUploadedParams): PollPromiseInterface<FromUrlStatusResponse> =>
  poll<FromUrlStatusResponse>(async () => {
    const response = await fromUrlStatus(token, settings)

    if (isSuccessResponse(response)) {
      return response
    }

    if (onProgress && typeof onProgress === "function") {
      onProgress(response)
    }

    return false
  }, timeout)

export default checkFileIsUploadedFromUrl

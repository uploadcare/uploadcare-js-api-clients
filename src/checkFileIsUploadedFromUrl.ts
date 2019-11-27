import { SettingsInterface } from "./types";
import { poll, CancelablePromise } from "./tools/poll";
import fromUrlStatus, { isSuccessResponse } from "./api/fromUrlStatus";
import { Uuid } from "./api/types";
import defaultSettings from "./defaultSettings";

type FileIsUploadedParams = {
  token: Uuid;
  timeout?: number;
  onProgress?: Function;
  settings?: SettingsInterface;
};

const checkFileIsUploadedFromUrl = ({
  token,
  timeout = defaultSettings.pollingTimeoutMilliseconds,
  onProgress,
  settings = {}
}: FileIsUploadedParams) =>
  poll(
    () => {
      const promise = fromUrlStatus(token, settings);

      return CancelablePromise(
        promise.then(response => {
          if (isSuccessResponse(response)) {
            return response;
          }

          if (onProgress && typeof onProgress === "function") {
            onProgress(response);
          }

          return false;
        }),
        promise.cancel.bind(promise)
      );
    },
    { timeout }
  );

export default checkFileIsUploadedFromUrl;

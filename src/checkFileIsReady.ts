import info from "./api/info";
import { SettingsInterface } from "./types";
import { poll, CancelablePromise } from "./tools/poll";
import { FileInfoInterface, Uuid } from "./api/types";
import defaultSettings from "./defaultSettings";

type FileIsReadyParams = {
  uuid: Uuid;
  timeout?: number;
  onProgress?: Function;
  settings?: SettingsInterface;
};

const checkFileIsReady = ({
  uuid,
  timeout = defaultSettings.pollingTimeoutMilliseconds,
  onProgress,
  settings = {}
}: FileIsReadyParams) =>
  poll(() => {
    let promise = info(uuid, settings);

    return CancelablePromise(
      promise.then(response => {
        if (response.is_ready) {
          return response;
        }

        if (typeof onProgress === "function") {
          onProgress(response);
        }

        return false;
      }),
      promise.cancel.bind(promise)
    );
  }, { timeout });

export default checkFileIsReady;

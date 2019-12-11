import defaultSettings from "../defaultSettings";
import fromUrl from "../api/fromUrl";
import fromUrlStatus from "../api/fromUrlStatus";
import checkFileIsUploadedFromUrl from "../checkFileIsUploadedFromUrl";
import CancelError from "../errors/CancelError";
import TokenWasNotFoundError from "../errors/TokenWasNotFoundError";

/* Types */
import { Uuid } from "../api/types";
import {
  ProgressStateEnum,
  SettingsInterface,
  UploadcareFileInterface
} from "../types";
import {
  FileUploadLifecycleInterface,
  UploadHandlerInterface
} from "../lifecycle/types";
import { Url } from "..";
import { PollPromiseInterface } from "../tools/poll";
import {
  FromUrlStatusResponse,
  isErrorResponse,
  isProgressResponse,
  isSuccessResponse,
  isUnknownResponse,
  isWaitingResponse
} from "../api/fromUrlStatus";
import {
  FromUrlResponse,
  isFileInfoResponse,
  isTokenResponse
} from "../api/fromUrl";

export class FileFromUrl
  implements
    UploadHandlerInterface<
      UploadcareFileInterface,
      FileUploadLifecycleInterface
    > {
  private isFileUploadedFromUrlPolling: PollPromiseInterface<
    FromUrlStatusResponse
  > | null = null;
  private isCancelled = false;
  private unknownStatusWasTimes = 0;
  private readonly data: Url;
  private readonly settings: SettingsInterface;

  constructor(data: Url, settings: SettingsInterface) {
    this.data = data;
    this.settings = settings;
  }

  upload(
    lifecycle: FileUploadLifecycleInterface
  ): Promise<UploadcareFileInterface> {
    const uploadLifecycle = lifecycle.uploadLifecycle;
    uploadLifecycle.handleUploading();

    return fromUrl(this.data, this.settings)
      .then(response => this.handleFromUrlResponse(response, lifecycle))
      .catch(uploadLifecycle.handleError.bind(uploadLifecycle));
  }

  private handleFromUrlResponse = (
    response: FromUrlResponse,
    lifecycle: FileUploadLifecycleInterface
  ) => {
    if (isTokenResponse(response)) {
      const { token } = response;

      return fromUrlStatus(token, this.settings).then(response =>
        this.handleFromUrlStatusResponse(token, response, lifecycle)
      );
    } else if (isFileInfoResponse(response)) {
      const { uuid } = response;

      return lifecycle.handleUploadedFile(uuid, this.settings);
    }
  };

  private handleFromUrlStatusResponse = (
    token: Uuid,
    response: FromUrlStatusResponse,
    lifecycle: FileUploadLifecycleInterface
  ) => {
    const uploadLifecycle = lifecycle.uploadLifecycle;
    this.isFileUploadedFromUrlPolling = checkFileIsUploadedFromUrl({
      token,
      timeout:
        this.settings.pollingTimeoutMilliseconds ||
        defaultSettings.pollingTimeoutMilliseconds,
      onProgress: response => {
        // Update uploading progress
        uploadLifecycle.handleUploading({
          total: response.total,
          loaded: response.done
        });
      },
      settings: this.settings
    });

    if (isUnknownResponse(response)) {
      this.unknownStatusWasTimes++;

      if (this.unknownStatusWasTimes === 3) {
        return Promise.reject(new TokenWasNotFoundError(token));
      } else {
        return this.isFileUploadedFromUrlPolling.then(status =>
          this.handleFromUrlStatusResponse(token, status, lifecycle)
        );
      }
    }

    if (isWaitingResponse(response)) {
      return this.isFileUploadedFromUrlPolling.then(status =>
        this.handleFromUrlStatusResponse(token, status, lifecycle)
      );
    }

    if (isErrorResponse(response)) {
      return uploadLifecycle.handleError(new Error(response.error));
    }

    if (isProgressResponse(response)) {
      if (this.isCancelled) {
        return Promise.reject(new CancelError());
      }

      uploadLifecycle.handleUploading({
        total: response.total,
        loaded: response.done
      });

      return this.isFileUploadedFromUrlPolling.then(status =>
        this.handleFromUrlStatusResponse(token, status, lifecycle)
      );
    }

    if (isSuccessResponse(response)) {
      const { uuid } = response;

      if (this.isCancelled) {
        return Promise.reject(new CancelError());
      }

      return lifecycle.handleUploadedFile(uuid, this.settings);
    }
  };

  cancel(lifecycle: FileUploadLifecycleInterface): void {
    const uploadLifecycle = lifecycle.uploadLifecycle;
    const isFileReadyPolling = lifecycle.getIsFileReadyPolling();
    const { state } = uploadLifecycle.getProgress();

    switch (state) {
      case ProgressStateEnum.Uploading:
        if (this.isFileUploadedFromUrlPolling) {
          this.isFileUploadedFromUrlPolling.cancel();
        } else {
          this.isCancelled = true;
        }
        break;
      case ProgressStateEnum.Uploaded:
      case ProgressStateEnum.Ready:
        if (isFileReadyPolling) {
          isFileReadyPolling.cancel();
        } else {
          this.isCancelled = true;
        }
        break;
    }
  }
}

import { Uuid } from "./types";

import getFormData from "./request/buildFormData.node";
import request from "./request/request.node";
import getUrl from "./request/getUrl";

import CancelController from "../CancelController";
import { getUserAgent } from "../defaultSettings";
import camelizeKeys from "../tools/camelizeKeys";

type SuccessResponse = {
  file: Uuid;
};

type FailedResponse = {
  error: {
    content: string;
    statusCode: number;
  };
};

type Response = SuccessResponse | FailedResponse;

export type Options = {
  publicKey: string;

  fileName?: string;
  baseURL?: string;
  secureSignature?: string;
  secureExpire?: string;
  store?: boolean;

  cancel?: CancelController;
  onProgress?: (event: any) => void;

  source?: string;
  integration?: string;
};

/**
 * Performs file uploading request to Uploadcare Upload API.
 * Can be canceled and has progress.
 */
export default function base(
  file: Blob | File | NodeJS.ReadableStream | Buffer | null,
  {
    publicKey,
    fileName,
    baseURL = "https://upload.uploadcare.com",
    secureSignature,
    secureExpire,
    store,
    cancel,
    onProgress,
    source = "local",
    integration
  }: Options
): Promise<SuccessResponse> {
  return request({
    method: "POST",
    url: getUrl(baseURL, "/base/", {
      jsonerrors: 1
    }),
    headers: {
      "X-UC-User-Agent": getUserAgent({ publicKey, integration })
    },
    data: getFormData([
      ["file", file, fileName || (file as File).name || "original"],
      ["UPLOADCARE_PUB_KEY", publicKey],
      [
        "UPLOADCARE_STORE",
        typeof store === "undefined" ? "auto" : store ? "1" : "0"
      ],
      ["signature", secureSignature],
      ["expire", secureExpire],
      ["source", source]
    ]),
    cancel,
    onProgress
  })
    .then(({ data }) => camelizeKeys<Response>(JSON.parse(data)))
    .then(response => {
      if ("error" in response) {
        throw Error(
          response.error.content + "\nStatus: " + response.error.statusCode
        );
      } else {
        return response;
      }
    });
}

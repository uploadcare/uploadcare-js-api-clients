import { Uuid } from "./types";

import getFormData from "./request/buildFormData.node";
import request from "./request/request.node";
import getUrl from "./request/getUrl";

import CancelController from "../CancelController";
import { getUserAgent } from "../defaultSettings";

export type Response = {
  file: Uuid;
};

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
  file: Blob | File | NodeJS.ReadableStream | Buffer,
  {
    publicKey,
    fileName = "original",
    baseURL = "https://upload.uploadcare.com",
    secureSignature,
    secureExpire,
    store,
    cancel,
    onProgress,
    source = "local",
    integration
  }: Options
): Promise<Response> {
  return request({
    method: "POST",
    url: getUrl(baseURL, "/base/", {
      jsonerrors: 1
    }),
    headers: {
      "X-UC-User-Agent": getUserAgent({ publicKey, integration })
    },
    data: getFormData({
      UPLOADCARE_PUB_KEY: publicKey,
      UPLOADCARE_STORE:
        typeof store === "undefined" ? "auto" : store ? "1" : "0",
      signature: secureSignature,
      expire: secureExpire,
      source: source,
      fileName: fileName || (file as File).name,
      file
    }),
    cancel,
    onProgress
  }).then(({ data }) => JSON.parse(data));
}

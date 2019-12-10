import { FileInfo } from "./base-types";
import request from "./request/request.node";
import getUrl from "./request/getUrl";

import CancelController from "../CancelController";
import { getUserAgent } from "../defaultSettings";
import camelizeKeys from "../tools/camelizeKeys";

type Url = string;

enum TypeEnum {
  Token = "token",
  FileInfo = "file_info"
}

type TokenResponse = {
  type: TypeEnum.Token;
  token: string;
};

type FileInfoResponse = {
  type: TypeEnum.FileInfo;
} & FileInfo;

type SuccessResponse = FileInfoResponse | TokenResponse;

type FailResponce = {
  error: {
    content: string;
    statusCode: number;
  };
};

type Response = FailResponce | SuccessResponse;

/**
 * TokenResponse Type Guard.
 */
export const isTokenResponse = (
  response: SuccessResponse
): response is TokenResponse => {
  return response.type !== undefined && response.type === TypeEnum.Token;
};

/**
 * FileInfoResponse Type Guard.
 */
export const isFileInfoResponse = (
  response: SuccessResponse
): response is FileInfoResponse => {
  return response.type !== undefined && response.type === TypeEnum.FileInfo;
};

type Options = {
  publicKey: string;

  baseURL?: string;
  store?: boolean;
  fileName?: string;
  checkForUrlDuplicates?: boolean;
  saveUrlForRecurrentUploads?: boolean;
  secureSignature?: string;
  secureExpire?: string;

  cancel?: CancelController;

  source?: string;
  integration?: string;
};

/**
 * Uploading files from URL.
 */
export default function fromUrl(
  sourceUrl: Url,
  {
    publicKey,
    baseURL = "https://upload.uploadcare.com",
    store,
    fileName,
    checkForUrlDuplicates,
    saveUrlForRecurrentUploads,
    secureSignature,
    secureExpire,
    source = "url",
    cancel,
    integration
  }: Options
): Promise<SuccessResponse> {
  return request({
    method: "POST",
    headers: {
      "X-UC-User-Agent": getUserAgent({ publicKey, integration })
    },
    url: getUrl(baseURL, "/from_url/", {
      jsonerrors: 1,
      pub_key: publicKey,
      source_url: sourceUrl,
      store: typeof store === "undefined" ? "auto" : store ? 1 : undefined,
      filename: fileName,
      check_URL_duplicates: checkForUrlDuplicates ? 1 : undefined,
      save_URL_duplicates: saveUrlForRecurrentUploads ? 1 : undefined,
      signature: secureSignature,
      expire: secureExpire,
      source: source
    }),
    cancel
  })
    .then(response => camelizeKeys<Response>(JSON.parse(response.data)))
    .then(response => {
      if ("error" in response) {
        throw new Error(`[${response.error.statusCode}] ${response.error.content}`);
      } else {
        return response;
      }
    });
}

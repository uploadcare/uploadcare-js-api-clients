import { Uuid, FileInfo } from "./base-types";
import request from "./request/request.node";
import getUrl from "./request/getUrl";

import CancelController from "../CancelController";
import { getUserAgent } from "../defaultSettings";
import camelizeKeys from "../tools/camelizeKeys";

type FailedResponse = {
  error: {
    content: string;
    statusCode: number;
  };
};

type Response = FileInfo | FailedResponse;

type Options = {
  publicKey: string;

  baseUrl?: string;

  cancel?: CancelController;

  source?: string;
  integration?: string;
  // cancel?: CancelController;
};

/**
 * Returns a JSON dictionary holding file info.
 */
export default function info(
  uuid: Uuid,
  {
    publicKey,
    baseUrl = "https://upload.uploadcare.com",
    cancel,
    source,
    integration
  }: Options
): Promise<FileInfo> {
  return request({
    method: "GET",
    headers: {
      "X-UC-User-Agent": getUserAgent({ publicKey, integration })
    },
    url: getUrl(baseUrl, "/info/", {
      jsonerrors: 1,
      pub_key: publicKey,
      file_id: uuid,
      source
    }),
    cancel,
  })
    .then(response => camelizeKeys<Response>(JSON.parse(response.data)))
    .then(response => {
      if ("error" in response) {
        throw new Error(
          `[${response.error.statusCode}] ${response.error.content}`
        );
      }

      return response;
    });
}

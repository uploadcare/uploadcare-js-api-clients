import { GroupId, GroupInfo } from "./base-types";
import request from "./request/request.node";
import getUrl from "./request/getUrl";

import CancelController from "../CancelController";
import { getUserAgent } from "../defaultSettings";
import camelizeKeys from "../tools/camelizeKeys";

type Options = {
  publicKey: string;
  baseURL?: string;

  cancel?: CancelController;

  source?: string;
  integration?: string;
};

type FailedResponse = {
  error: {
    content: string;
    statusCode: number;
  };
};

type Response = GroupInfo | FailedResponse;

/**
 * Get info about group.
 */
export default function groupInfo(
  id: GroupId,
  {
    publicKey,
    baseURL = "https://upload.uploadcare.com",
    cancel,
    source,
    integration
  }: Options
): Promise<GroupInfo> {
  return request({
    method: "GET",
    headers: {
      "X-UC-User-Agent": getUserAgent({ publicKey, integration })
    },
    url: getUrl(baseURL, "/group/info/", {
      jsonerrors: 1,
      pub_key: publicKey,
      group_id: id,
      source
    }),
    cancel
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

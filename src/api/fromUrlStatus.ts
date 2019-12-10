import { FileInfo, Token } from "./base-types";
import request from "./request/request.node";
import getUrl from "./request/getUrl";

import { getUserAgent } from "../defaultSettings";
import CancelController from "../CancelController";
import camelizeKeys from "../tools/camelizeKeys";

export enum Status {
  Unknown = "unknown",
  Waiting = "waiting",
  Progress = "progress",
  Error = "error",
  Success = "success"
}

type UnknownResponse = {
  status: Status.Unknown;
};

type WaitingResponse = {
  status: Status.Waiting;
};

type ProgressResponse = {
  status: Status.Progress;
  size: number;
  done: number;
  total: number;
};

type ErrorResponse = {
  status: Status.Error;
  error: string;
};

type SuccessResponse = {
  status: Status.Success;
} & FileInfo;

export type StatusResponse =
  | UnknownResponse
  | WaitingResponse
  | ProgressResponse
  | ErrorResponse
  | SuccessResponse;

type FiledResponse = {
  error: {
    content: string;
    statusCode: number
  };
};

type Response = StatusResponse | FiledResponse

/**
 * UnknownResponse Type Guard.
 */
export const isUnknownResponse = (
  response: StatusResponse
): response is UnknownResponse => {
  return response.status !== undefined && response.status === Status.Unknown;
};

/**
 * WaitingResponse Type Guard.
 */
export const isWaitingResponse = (
  response: StatusResponse
): response is WaitingResponse => {
  return response.status !== undefined && response.status === Status.Waiting;
};

/**
 * UnknownResponse Type Guard.
 */
export const isProgressResponse = (
  response: StatusResponse
): response is ProgressResponse => {
  return response.status !== undefined && response.status === Status.Progress;
};

/**
 * UnknownResponse Type Guard.
 */
export const isErrorResponse = (
  response: Response
): response is ErrorResponse => {
  return 'status' in response && response.status === Status.Error;
};

/**
 * SuccessResponse Type Guard.
 */
export const isSuccessResponse = (
  response: StatusResponse
): response is SuccessResponse => {
  return response.status !== undefined && response.status === Status.Success;
};

export type Options = {
  baseUrl?: string;

  cancel?: CancelController;

  integration?: string;
};

/**
 * Checking upload status and working with file tokens.
 */
export default function fromUrlStatus(
  token: Token,
  { baseUrl = "https://upload.uploadcare.com", cancel, integration }: Options = {}
): Promise<StatusResponse> {
  return request({
    method: "GET",
    // TODO ??
    // headers: {
    //   "X-UC-User-Agent": getUserAgent({ publicKey, integration })
    // },
    url: getUrl(baseUrl, "/from_url/status/", {
      jsonerrors: 1,
      token
    }),
    cancel
  }).then(response =>
    camelizeKeys<Response>(JSON.parse(response.data))
  ).then(response => {
    if ('error' in response && !isErrorResponse(response)) {
      throw new Error(`[${response.error.statusCode}] ${response.error.content}`)
    }

    return response
  })
}

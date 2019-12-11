import { ErrorRequestInfoInterface, ErrorResponseInfoInterface } from "./types";
import RequestError from "./RequestError";

export default class RequestWasThrottledError extends Error {
  readonly request: ErrorRequestInfoInterface;
  readonly response: ErrorResponseInfoInterface;

  constructor(requestError: RequestError, retryThrottledMaxTimes: number) {
    super();

    this.name = "RequestWasThrottledError";
    this.message = `Request was throttled more than ${retryThrottledMaxTimes}`;
    this.request = requestError.request;
    this.response = requestError.response;

    Object.setPrototypeOf(this, RequestWasThrottledError.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RequestWasThrottledError);
    } else {
      this.stack = new Error().stack;
    }
  }
}

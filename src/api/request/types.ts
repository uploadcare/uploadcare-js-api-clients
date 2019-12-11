import { FileData } from "../../types";
import { CancelableInterface } from "../../lifecycle/types";

export type Query = {
  [key: string]: string | string[] | boolean | number | void;
};

export type Body = {
  [key: string]: string[] | string | boolean | number | FileData | void;
};

export type Headers = {
  [key: string]: string;
};

export interface RequestOptionsInterface {
  method?: string;
  path: string;
  query?: Query;
  body?: Body;
  headers?: Headers;
  baseURL?: string;
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
  retryThrottledMaxTimes?: number;
  maxConcurrentRequests?: number;
}

export type RequestResponse = {
  headers?: object;
  url: string;
  data: any;
};

export interface RequestInterface
  extends Promise<RequestResponse>,
    CancelableInterface {}

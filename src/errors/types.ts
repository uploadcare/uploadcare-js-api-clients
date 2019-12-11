export type ErrorRequestInfo = {
  headers: object;
  url: string;
}

export type ErrorResponseInfo = {
  status: number;
  statusText: string;
}

export interface UploadcareError {
  message: string;
  name: string;
  code?: number;
  request?: ErrorRequestInfo;
  response?: ErrorResponseInfo;
}

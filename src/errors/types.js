/* @flow */

export type ErrorRequestInfo = {|
  headers: Object,
  url: string,
|}

export type ErrorResponseInfo = {|
  status: number,
  statusText: string,
|}

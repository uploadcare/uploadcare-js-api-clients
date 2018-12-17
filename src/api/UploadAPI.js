/* @flow */
import request from './request'
import type UploadcareUpload from '../UploadcareUpload'
import type {RequestOptions, RequestResponse} from './request'

export default class UploadAPI {
  client: UploadcareUpload

  constructor(client: UploadcareUpload) {
    this.client = client
  }

  request(options: RequestOptions): RequestResponse {
    return request({
      ...options,
      baseURL: options.baseURL || this.client.settings.baseURL,
      userAgent: options.userAgent || this.client.settings.userAgent,
    })
  }
}

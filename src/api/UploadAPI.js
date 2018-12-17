/* @flow */
import request from './request'
import base from './base'
import type UploadcareUpload from '../UploadcareUpload'
import type {RequestOptions, RequestResponse} from './request'
import type {FileData, Settings} from '../types'
import type {Uploading} from './base'

export default class UploadAPI {
  client: UploadcareUpload

  constructor(client: UploadcareUpload) {
    this.client = client
  }

  request(options: RequestOptions): Promise<RequestResponse> {
    return request({
      ...options,
      baseURL: options.baseURL || this.client.settings.baseURL,
      userAgent: options.userAgent || this.client.settings.userAgent,
    })
  }

  base(file: FileData, settings: Settings = {}): Uploading {
    return base(file, {
      ...this.client.settings,
      ...settings,
    })
  }
}

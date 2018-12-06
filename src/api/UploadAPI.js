/* @flow */
import request from './request'
import type UploadcareUpload from '../UploadcareUpload'
import type {RequestConfig, RequestResponse} from './request'
import type {Settings} from '../types'

export default class UploadAPI {
  client: UploadcareUpload

  constructor(client: UploadcareUpload) {
    this.client = client
  }

  request(config: RequestConfig, settings: Settings = {}): RequestResponse {
    return request(config, {
      ...this.client.settings,
      ...settings,
    })
  }
}

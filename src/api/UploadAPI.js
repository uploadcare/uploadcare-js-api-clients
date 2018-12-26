/* @flow */
import request, {prepareOptions} from './request'
import base from './base'
import type UploadClient from '../UploadClient'
import type {RequestOptions, RequestResponse} from './request'
import type {FileData, Settings} from '../types'
import type {Uploading} from './base'
import info from './info'
import type {InfoResponse} from './info'

export default class UploadAPI {
  client: UploadClient

  constructor(client: UploadClient) {
    this.client = client
  }

  request(options: RequestOptions): Promise<RequestResponse> {
    return request(prepareOptions(options, this.client.settings))
  }

  base(file: FileData, settings: Settings = {}): Uploading {
    return base(file, {
      ...this.client.settings,
      ...settings,
    })
  }

  info(id: string, settings: Settings = {}): Promise<InfoResponse> {
    return info(id, {
      ...this.client.settings,
      ...settings,
    })
  }
}

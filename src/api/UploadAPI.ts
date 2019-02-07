import request, {prepareOptions} from './request'
import base from './base'
import {DirectUpload} from './base'
import UploadClient from '../UploadClient'
import {RequestOptions, RequestResponse} from './request'
import {FileData, Settings} from '../types'
import info from './info'
import {InfoResponse} from './info'

export default class UploadAPI {
  client: UploadClient

  constructor(client: UploadClient) {
    this.client = client
  }

  request(options: RequestOptions): Promise<RequestResponse> {
    return request(prepareOptions(options, this.client.settings))
  }

  base(data: FileData, settings: Settings = {}): DirectUpload {
    return base(data, {
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

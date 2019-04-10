import request, {prepareOptions} from './request'
import base, {DirectUploadInterface} from './base'
import UploadClient from '../UploadClient'
import {RequestOptions, RequestResponse} from './request'
import {FileData, Settings} from '../types'
import info from './info'
import {InfoResponse} from './info'
import fromUrl, {FromUrlResponse, Url} from './fromUrl'
import fromUrlStatus, {FromUrlStatusResponse} from './fromUrlStatus'

export default class UploadAPI {
  client: UploadClient

  constructor(client: UploadClient) {
    this.client = client
  }

  protected getRequestOptions = (options) => {
    return prepareOptions(options, this.client.settings)
  }

  protected getSettings = (settings) => {
    return {
      ...this.client.settings,
      ...settings,
    }
  }

  request(options: RequestOptions): Promise<RequestResponse> {
    return request(this.getRequestOptions(options))
  }

  base(data: FileData, settings: Settings = {}): DirectUploadInterface {
    return base(data, this.getSettings(settings))
  }

  info(uuid: string, settings: Settings = {}): Promise<InfoResponse> {
    return info(uuid, this.getSettings(settings))
  }

  fromUrl(sourceUrl: Url, settings: Settings = {}): Promise<FromUrlResponse> {
    return fromUrl(sourceUrl, this.getSettings(settings))
  }

  fromUrlStatus(token: string, settings: Settings = {}): Promise<FromUrlStatusResponse> {
    return fromUrlStatus(token,this.getSettings(settings))
  }
}

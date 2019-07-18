import info, {InfoResponse} from './info'
import UploadClient from '../UploadClient'
import fromUrlStatus, {FromUrlStatusResponse} from './fromUrlStatus'
import base, {DirectUploadInterface} from './base'
import {GroupId, Token, UploadAPIInterface, Uuid} from './types'
import {RequestOptions, RequestResponse} from './request/types'
import fromUrl, {FromUrlResponse, Url} from './fromUrl'
import groupInfo from './groupInfo'
import {FileData, Settings} from '../types'
import {prepareOptions} from './request/prepareOptions'
import group, {GroupInfoResponse} from './group'
import request from './request/request'

class UploadAPI implements UploadAPIInterface {
  readonly client: UploadClient

  constructor(client: UploadClient) {
    this.client = client
  }

  private getRequestOptions = (options) => {
    return prepareOptions(options, this.client.getSettings())
  }

  private getResultSettings = (settings) => {
    return {
      ...this.client.getSettings(),
      ...settings,
    }
  }

  request(options: RequestOptions): Promise<RequestResponse> {
    return request(this.getRequestOptions(options))
  }

  base(data: FileData, settings: Settings = {}): DirectUploadInterface {
    return base(data, this.getResultSettings(settings))
  }

  info(uuid: Uuid, settings: Settings = {}): Promise<InfoResponse> {
    return info(uuid, this.getResultSettings(settings))
  }

  fromUrl(sourceUrl: Url, settings: Settings = {}): Promise<FromUrlResponse> {
    return fromUrl(sourceUrl, this.getResultSettings(settings))
  }

  fromUrlStatus(token: Token, settings: Settings = {}): Promise<FromUrlStatusResponse> {
    return fromUrlStatus(token, this.getResultSettings(settings))
  }

  group(files: Uuid[], settings: Settings): Promise<GroupInfoResponse> {
    return group(files, this.getResultSettings(settings))
  }

  groupInfo(id: GroupId, settings: Settings): Promise<GroupInfoResponse> {
    return groupInfo(id, this.getResultSettings(settings))
  }
}

export default UploadAPI

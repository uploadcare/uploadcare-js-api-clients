import info, {InfoResponse} from './info'
import UploadClient from '../UploadClient'
import fromUrlStatus, {FromUrlStatusResponse} from './fromUrlStatus'
import base from './base'
import {BaseResponse, DirectUploadInterface, GroupId, Token, UploadAPIInterface, Uuid} from './types'
import {RequestOptions, RequestResponse} from './request/types'
import fromUrl, {FromUrlResponse, Url} from './fromUrl'
import groupInfo from './groupInfo'
import {FileData, Settings} from '../types'
import {prepareOptions} from './request/prepareOptions'
import group, {GroupInfoResponse} from './group'
import request from './request/request'
import {
  MultipartCompleteResponse,
  MultipartPart, MultipartStartResponse,
} from './multipart/types'
import multipartComplete from './multipart/multipartComplete'
import multipartStart from './multipart/multipartStart'
import multipartUpload from './multipart/multipartUpload'
import {BaseThenableInterface, CancelableThenableInterface} from '../thenable/types'

class UploadAPI implements UploadAPIInterface {
  readonly client: UploadClient

  constructor(client: UploadClient) {
    this.client = client
  }

  private getResultSettings = (settings) => {
    return {
      ...this.client.getSettings(),
      ...settings,
    }
  }

  request(options: RequestOptions): Promise<RequestResponse> {
    const preparedOptions = prepareOptions(options, this.client.getSettings())

    return request(preparedOptions)
  }

  base(data: FileData, settings: Settings = {}): BaseThenableInterface<BaseResponse> {
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

  multipartStart(file: FileData, settings: Settings): CancelableThenableInterface<MultipartStartResponse> {
    return multipartStart(file, this.getResultSettings(settings))
  }

  multipartUpload(file: FileData, parts: MultipartPart[], settings: Settings): BaseThenableInterface<any> {
    return multipartUpload(file, parts, this.getResultSettings(settings))
  }

  multipartComplete(uuid: Uuid, settings: Settings): CancelableThenableInterface<MultipartCompleteResponse> {
    return multipartComplete(uuid, this.getResultSettings(settings))
  }
}

export default UploadAPI

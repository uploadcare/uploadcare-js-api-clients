import info from './info'
import UploadClient from '../UploadClient'
import fromUrlStatus, {FromUrlStatusResponse} from './fromUrlStatus'
import base, {BaseResponse} from './base'
import {FileInfoInterface, GroupId, GroupInfoInterface, Token, UploadAPIInterface, Uuid} from './types'
import {RequestOptions, RequestResponse} from './request/types'
import fromUrl, {FromUrlResponse, Url} from './fromUrl'
import groupInfo from './groupInfo'
import {FileData, SettingsInterface} from '../types'
import {prepareOptions} from './request/prepareOptions'
import group from './group'
import request from './request/request'
import {
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

  base(data: FileData, settings: SettingsInterface = {}): BaseThenableInterface<BaseResponse> {
    return base(data, this.getResultSettings(settings))
  }

  info(uuid: Uuid, settings: SettingsInterface = {}): Promise<FileInfoInterface> {
    return info(uuid, this.getResultSettings(settings))
  }

  fromUrl(sourceUrl: Url, settings: SettingsInterface = {}): Promise<FromUrlResponse> {
    return fromUrl(sourceUrl, this.getResultSettings(settings))
  }

  fromUrlStatus(token: Token, settings: SettingsInterface = {}): Promise<FromUrlStatusResponse> {
    return fromUrlStatus(token, this.getResultSettings(settings))
  }

  group(uuids: Uuid[], settings: SettingsInterface): Promise<GroupInfoInterface> {
    return group(uuids, this.getResultSettings(settings))
  }

  groupInfo(id: GroupId, settings: SettingsInterface): Promise<GroupInfoInterface> {
    return groupInfo(id, this.getResultSettings(settings))
  }

  multipartStart(file: FileData, settings: SettingsInterface): CancelableThenableInterface<MultipartStartResponse> {
    return multipartStart(file, this.getResultSettings(settings))
  }

  multipartUpload(file: FileData, parts: MultipartPart[], settings: SettingsInterface): BaseThenableInterface<any> {
    return multipartUpload(file, parts, this.getResultSettings(settings))
  }

  multipartComplete(uuid: Uuid, settings: SettingsInterface): CancelableThenableInterface<FileInfoInterface> {
    return multipartComplete(uuid, this.getResultSettings(settings))
  }
}

export default UploadAPI

import info from './info'
import UploadClient from '../UploadClient'
import fromUrlStatus, {FromUrlStatusResponse} from './fromUrlStatus'
import base, {BaseResponse} from './base'
import {FileInfoInterface, GroupId, GroupInfoInterface, Token, UploadAPIInterface, Uuid} from './types'
import {RequestOptionsInterface, RequestResponse} from './request/types'
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
import {BaseHooksInterface} from '../lifecycle/types'

class UploadAPI implements UploadAPIInterface {
  readonly client: UploadClient

  constructor(client: UploadClient) {
    this.client = client
  }

  private getExtendedSettings = (settings): SettingsInterface => {
    return {
      ...this.client.getSettings(),
      ...settings,
    }
  }

  request(options: RequestOptionsInterface): Promise<RequestResponse> {
    const preparedOptions = prepareOptions(options, this.client.getSettings())

    return request(preparedOptions)
  }

  base(data: FileData, settings: SettingsInterface = {}, hooks?: BaseHooksInterface): BaseThenableInterface<BaseResponse> {
    return base(data, this.getExtendedSettings(settings), hooks)
  }

  info(uuid: Uuid, settings: SettingsInterface = {}): CancelableThenableInterface<FileInfoInterface> {
    return info(uuid, this.getExtendedSettings(settings))
  }

  fromUrl(sourceUrl: Url, settings: SettingsInterface = {}): CancelableThenableInterface<FromUrlResponse> {
    return fromUrl(sourceUrl, this.getExtendedSettings(settings))
  }

  fromUrlStatus(token: Token, settings: SettingsInterface = {}): CancelableThenableInterface<FromUrlStatusResponse> {
    return fromUrlStatus(token, this.getExtendedSettings(settings))
  }

  group(uuids: Uuid[], settings: SettingsInterface): CancelableThenableInterface<GroupInfoInterface> {
    return group(uuids, this.getExtendedSettings(settings))
  }

  groupInfo(id: GroupId, settings: SettingsInterface): CancelableThenableInterface<GroupInfoInterface> {
    return groupInfo(id, this.getExtendedSettings(settings))
  }

  multipartStart(file: FileData, settings: SettingsInterface): CancelableThenableInterface<MultipartStartResponse> {
    return multipartStart(file, this.getExtendedSettings(settings))
  }

  multipartUpload(file: FileData, parts: MultipartPart[], settings: SettingsInterface): BaseThenableInterface<any> {
    return multipartUpload(file, parts, this.getExtendedSettings(settings))
  }

  multipartComplete(uuid: Uuid, settings: SettingsInterface): CancelableThenableInterface<FileInfoInterface> {
    return multipartComplete(uuid, this.getExtendedSettings(settings))
  }
}

export default UploadAPI

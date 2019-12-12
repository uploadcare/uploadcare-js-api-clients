import UploadClient from '../UploadClient'
import request from './request/request.node'
import base from './base'
import info from './info'
import fromUrl from './fromUrl'
import fromUrlStatus from './fromUrlStatus'
import group, { GroupOptions } from './group'
import groupInfo from './groupInfo'

/* Types */
import { BaseOptions, FileData, BaseResponse } from './base'
import { RequestOptions, RequestResponse } from './request/request.node'
import { FileInfo, GroupId, GroupInfo, Token, Url, Uuid } from './types'
import { InfoOptions } from './info'
import { FromUrlOptions, FromUrlResponse } from './fromUrl'
import { FromUrlStatusOptions, FromUrlStatusResponse } from './fromUrlStatus'

class UploadAPI {
  private client: UploadClient

  constructor(client: UploadClient) {
    this.client = client
  }

  request(options: RequestOptions): Promise<RequestResponse> {
    return request(options)
  }

  base(file: FileData, options: BaseOptions): Promise<BaseResponse> {
    const settings = this.client.getSettings()

    return base(file, {
      ...options,
      fileName: options.fileName || settings.fileName,
      baseURL: options.baseURL || settings.baseURL,
      secureSignature: options.secureSignature || settings.secureSignature,
      secureExpire: options.secureExpire || settings.secureExpire,
      store: options.store || settings.store,
      source: options.source || settings.source,
      integration: options.integration || settings.integration
    })
  }

  info(uuid: Uuid, options: InfoOptions): Promise<FileInfo> {
    const settings = this.client.getSettings()

    return info(uuid, {
      ...options,
      baseURL: options.baseURL || settings.baseURL,
      source: options.source || settings.source,
      integration: options.integration || settings.integration
    })
  }

  fromUrl(sourceUrl: Url, options: FromUrlOptions): Promise<FromUrlResponse> {
    const settings = this.client.getSettings()

    return fromUrl(sourceUrl, {
      ...options,
      baseURL: options.baseURL || settings.baseURL,
      store: options.store || settings.store,
      fileName: options.fileName || settings.fileName,
      checkForUrlDuplicates:
        options.checkForUrlDuplicates || settings.checkForUrlDuplicates,
      saveUrlForRecurrentUploads:
        options.saveUrlForRecurrentUploads ||
        settings.saveUrlForRecurrentUploads,
      secureSignature: options.secureSignature || settings.secureSignature,
      secureExpire: options.secureExpire || settings.secureExpire,
      source: options.source || settings.source,
      integration: options.integration || settings.integration
    })
  }

  fromUrlStatus(
    token: Token,
    options: FromUrlStatusOptions
  ): Promise<FromUrlStatusResponse> {
    const settings = this.client.getSettings()

    return fromUrlStatus(token, {
      ...options,
      baseURL: options.baseURL || settings.baseURL,
      integration: options.integration || settings.integration
    })
  }

  group(uuids: Uuid[], options: GroupOptions): Promise<GroupInfo> {
    const settings = this.client.getSettings()

    return group(uuids, {
      ...options,
      baseURL: options.baseURL || settings.baseURL,
      jsonpCallback: options.jsonpCallback || settings.jsonpCallback,
      secureSignature: options.secureSignature || settings.secureSignature,
      secureExpire: options.secureExpire || settings.secureExpire,
      source: options.source || settings.source,
      integration: options.integration || settings.integration
    })
  }

  groupInfo(id: GroupId, options): Promise<GroupInfo> {
    const settings = this.client.getSettings()

    return groupInfo(id, {
      ...options,
      baseURL: options.baseURL || settings.baseURL,
      source: options.source || settings.source,
      integration: options.integration || settings.integration
    })
  }

  // multipartStart(
  //   file: FileData,
  //   settings: Settings = {},
  //   hooks?: CancelHookInterface
  // ): CancelableThenableInterface<MultipartStartResponse> {
  //   return multipartStart(file, this.getExtendedSettings(settings), hooks)
  // }
  //
  // multipartUpload(
  //   file: FileData,
  //   parts: MultipartPart[],
  //   settings: Settings = {},
  //   hooks?: CancelHookInterface
  // ): BaseThenableInterface<any> {
  //   return multipartUpload(
  //     file,
  //     parts,
  //     this.getExtendedSettings(settings),
  //     hooks
  //   )
  // }
  //
  // multipartComplete(
  //   uuid: Uuid,
  //   settings: Settings = {},
  //   hooks?: CancelHookInterface
  // ): CancelableThenableInterface<FileInfo> {
  //   return multipartComplete(uuid, this.getExtendedSettings(settings), hooks)
  // }
}

export default UploadAPI

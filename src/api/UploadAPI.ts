import UploadClient from '../UploadClient'
import base from './base'
import info from './info'
import fromUrl from './fromUrl'
import fromUrlStatus from './fromUrlStatus'
import group from './group'
import groupInfo from './groupInfo'
import multipartStart from './multipartStart'
import multipartComplete from './multipartComplete'
import multipartUpload from './multipartUpload'

/* Types */
import { BaseOptions, FileData, BaseResponse } from './base'
import { FileInfo, GroupId, GroupInfo, Token, Url, Uuid } from './types'
import { InfoOptions } from './info'
import { FromUrlOptions, FromUrlResponse } from './fromUrl'
import { FromUrlStatusOptions, FromUrlStatusResponse } from './fromUrlStatus'
import { GroupOptions } from './group'
import { GroupInfoOptions } from './groupInfo'
import {
  MultipartStartOptions,
  MultipartStartResponse,
  MultipartPart
} from './multipartStart'
import { MultipartCompleteOptions } from './multipartComplete'
import {
  MultipartUploadOptions,
  MultipartUploadResponse
} from './multipartUpload'
import { SettingsInterface } from '../types'

/**
 * Populate options with settings.
 * @param {<T>} options
 * @param {SettingsInterface} settings
 */
const populateOptionsWithSettings = <T>(
  options: T,
  settings: SettingsInterface
): T => ({
  ...settings,
  ...options
})

class UploadAPI {
  private client: UploadClient

  constructor(client: UploadClient) {
    this.client = client
  }

  base(file: FileData, options: BaseOptions): Promise<BaseResponse> {
    const settings = this.client.getSettings()

    return base(file, populateOptionsWithSettings(options, settings))
  }

  info(uuid: Uuid, options: InfoOptions): Promise<FileInfo> {
    const settings = this.client.getSettings()

    return info(uuid, populateOptionsWithSettings(options, settings))
  }

  fromUrl(sourceUrl: Url, options: FromUrlOptions): Promise<FromUrlResponse> {
    const settings = this.client.getSettings()

    return fromUrl(sourceUrl, populateOptionsWithSettings(options, settings))
  }

  fromUrlStatus(
    token: Token,
    options: FromUrlStatusOptions
  ): Promise<FromUrlStatusResponse> {
    const settings = this.client.getSettings()

    return fromUrlStatus(token, populateOptionsWithSettings(options, settings))
  }

  group(uuids: Uuid[], options: GroupOptions): Promise<GroupInfo> {
    const settings = this.client.getSettings()

    return group(uuids, populateOptionsWithSettings(options, settings))
  }

  groupInfo(id: GroupId, options: GroupInfoOptions): Promise<GroupInfo> {
    const settings = this.client.getSettings()

    return groupInfo(id, populateOptionsWithSettings(options, settings))
  }

  multipartStart(
    size: number,
    options: MultipartStartOptions
  ): Promise<MultipartStartResponse> {
    const settings = this.client.getSettings()

    return multipartStart(size, populateOptionsWithSettings(options, settings))
  }

  multipartUpload(
    part: Buffer,
    url: MultipartPart,
    options: MultipartUploadOptions
  ): Promise<MultipartUploadResponse> {
    const settings = this.client.getSettings()

    return multipartUpload(
      part,
      url,
      populateOptionsWithSettings(options, settings)
    )
  }

  multipartComplete(
    uuid: Uuid,
    options: MultipartCompleteOptions
  ): Promise<FileInfo> {
    const settings = this.client.getSettings()

    return multipartComplete(
      uuid,
      populateOptionsWithSettings(options, settings)
    )
  }
}

export default UploadAPI

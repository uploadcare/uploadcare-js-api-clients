import defaultSettings from './defaultSettings'
import base from './api/base'
import info from './api/info'
import fromUrl from './api/fromUrl'
import fromUrlStatus from './api/fromUrlStatus'
import group from './api/group'
import groupInfo from './api/groupInfo'
import multipartStart from './api/multipartStart'
import multipartComplete from './api/multipartComplete'
import multipartUpload from './api/multipartUpload'

/* Types */
import { SettingsInterface } from './types'
import { BaseOptions, FileData as BaseFileData, BaseResponse } from './api/base'
import { FileInfo, GroupId, GroupInfo, Token, Url, Uuid } from './api/types'
import { InfoOptions } from './api/info'
import { FromUrlOptions, FromUrlResponse } from './api/fromUrl'
import {
  FromUrlStatusOptions,
  FromUrlStatusResponse
} from './api/fromUrlStatus'
import { GroupOptions } from './api/group'
import { GroupInfoOptions } from './api/groupInfo'
import {
  MultipartStartOptions,
  MultipartStartResponse,
  MultipartPart
} from './api/multipartStart'
import { MultipartCompleteOptions } from './api/multipartComplete'
import {
  MultipartUploadOptions,
  MultipartUploadResponse
} from './api/multipartUpload'

/**
 * Populate options with settings.
 */
const populateOptionsWithSettings = <T>(
  options: T,
  settings: SettingsInterface
): T => ({
  ...settings,
  ...options
})

class UploadClient {
  private settings: SettingsInterface

  constructor(settings: SettingsInterface = {}) {
    this.settings = Object.assign({}, defaultSettings, settings)
  }

  updateSettings(newSettings: SettingsInterface = {}): void {
    this.settings = Object.assign(this.settings, newSettings)
  }

  getSettings(): SettingsInterface {
    return this.settings
  }

  base(file: BaseFileData, options: BaseOptions): Promise<BaseResponse> {
    const settings = this.getSettings()

    return base(file, populateOptionsWithSettings(options, settings))
  }

  info(uuid: Uuid, options: InfoOptions): Promise<FileInfo> {
    const settings = this.getSettings()

    return info(uuid, populateOptionsWithSettings(options, settings))
  }

  fromUrl(sourceUrl: Url, options: FromUrlOptions): Promise<FromUrlResponse> {
    const settings = this.getSettings()

    return fromUrl(sourceUrl, populateOptionsWithSettings(options, settings))
  }

  fromUrlStatus(
    token: Token,
    options: FromUrlStatusOptions
  ): Promise<FromUrlStatusResponse> {
    const settings = this.getSettings()

    return fromUrlStatus(token, populateOptionsWithSettings(options, settings))
  }

  group(uuids: Uuid[], options: GroupOptions): Promise<GroupInfo> {
    const settings = this.getSettings()

    return group(uuids, populateOptionsWithSettings(options, settings))
  }

  groupInfo(id: GroupId, options: GroupInfoOptions): Promise<GroupInfo> {
    const settings = this.getSettings()

    return groupInfo(id, populateOptionsWithSettings(options, settings))
  }

  multipartStart(
    size: number,
    options: MultipartStartOptions
  ): Promise<MultipartStartResponse> {
    const settings = this.getSettings()

    return multipartStart(size, populateOptionsWithSettings(options, settings))
  }

  multipartUpload(
    part: Buffer | Blob,
    url: MultipartPart,
    options: MultipartUploadOptions
  ): Promise<MultipartUploadResponse> {
    const settings = this.getSettings()

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
    const settings = this.getSettings()

    return multipartComplete(
      uuid,
      populateOptionsWithSettings(options, settings)
    )
  }

  // fileFrom(
  //   data: FileData | Url | Uuid,
  //   settings?: SettingsInterface,
  //   hooks?: LifecycleHooksInterface<UploadcareFileInterface>
  // ): UploadInterface<UploadcareFileInterface> {
  //   return fileFrom(
  //     data,
  //     {
  //       ...this.settings,
  //       ...settings
  //     },
  //     hooks
  //   )
  // }

  // groupFrom(
  //   data: FileData[] | Url[] | Uuid[],
  //   settings?: SettingsInterface,
  //   hooks?: LifecycleHooksInterface<UploadcareGroupInterface>
  // ): UploadInterface<UploadcareGroupInterface> {
  //   return groupFrom(
  //     data,
  //     {
  //       ...this.settings,
  //       ...settings
  //     },
  //     hooks
  //   )
  // }
}

export default UploadClient

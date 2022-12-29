import base, { BaseOptions, BaseResponse } from './api/base'
import fromUrl, { FromUrlOptions, FromUrlResponse } from './api/fromUrl'
import fromUrlStatus, {
  FromUrlStatusOptions,
  FromUrlStatusResponse
} from './api/fromUrlStatus'
import group, { GroupOptions } from './api/group'
import groupInfo, { GroupInfoOptions } from './api/groupInfo'
import info, { InfoOptions } from './api/info'
import multipartComplete, {
  MultipartCompleteOptions
} from './api/multipartComplete'
import multipartStart, {
  MultipartPart,
  MultipartStartOptions,
  MultipartStartResponse
} from './api/multipartStart'
import multipartUpload, {
  MultipartUploadOptions,
  MultipartUploadResponse
} from './api/multipartUpload'
import defaultSettings from './defaultSettings'
import { UploadcareFile } from './tools/UploadcareFile'
import { UploadcareGroup } from './tools/UploadcareGroup'
import { FileFromOptions, uploadFile } from './uploadFile'

import { FileInfo, GroupId, GroupInfo, Token, Url, Uuid } from './api/types'
import {
  SupportedFileInput,
  BrowserFile,
  NodeFile,
  Settings,
  Sliceable
} from './types'
import { uploadFileGroup, GroupFromOptions } from './uploadFileGroup'

/**
 * Populate options with settings.
 */
const populateOptionsWithSettings = <T>(
  options: T,
  settings: Settings
): Settings & T => ({
  ...settings,
  ...options
})

export default class UploadClient {
  private settings: Settings

  constructor(settings: Settings) {
    this.settings = Object.assign({}, defaultSettings, settings)
  }

  updateSettings(newSettings: Settings): void {
    this.settings = Object.assign(this.settings, newSettings)
  }

  getSettings(): Settings {
    return this.settings
  }

  base(
    file: SupportedFileInput,
    options: Partial<BaseOptions> = {}
  ): Promise<BaseResponse> {
    const settings = this.getSettings()

    return base(file, populateOptionsWithSettings(options, settings))
  }

  info(uuid: Uuid, options: Partial<InfoOptions> = {}): Promise<FileInfo> {
    const settings = this.getSettings()

    return info(uuid, populateOptionsWithSettings(options, settings))
  }

  fromUrl(
    sourceUrl: Url,
    options: Partial<FromUrlOptions> = {}
  ): Promise<FromUrlResponse> {
    const settings = this.getSettings()

    return fromUrl(sourceUrl, populateOptionsWithSettings(options, settings))
  }

  fromUrlStatus(
    token: Token,
    options: Partial<FromUrlStatusOptions> = {}
  ): Promise<FromUrlStatusResponse> {
    const settings = this.getSettings()

    return fromUrlStatus(token, populateOptionsWithSettings(options, settings))
  }

  group(
    uuids: Uuid[],
    options: Partial<GroupOptions> = {}
  ): Promise<GroupInfo> {
    const settings = this.getSettings()

    return group(uuids, populateOptionsWithSettings(options, settings))
  }

  groupInfo(
    id: GroupId,
    options: Partial<GroupInfoOptions> = {}
  ): Promise<GroupInfo> {
    const settings = this.getSettings()

    return groupInfo(id, populateOptionsWithSettings(options, settings))
  }

  multipartStart(
    size: number,
    options: Partial<MultipartStartOptions> = {}
  ): Promise<MultipartStartResponse> {
    const settings = this.getSettings()

    return multipartStart(size, populateOptionsWithSettings(options, settings))
  }

  multipartUpload(
    part: Sliceable,
    url: MultipartPart,
    options: Partial<MultipartUploadOptions> = {}
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
    options: Partial<MultipartCompleteOptions> = {}
  ): Promise<FileInfo> {
    const settings = this.getSettings()

    return multipartComplete(
      uuid,
      populateOptionsWithSettings(options, settings)
    )
  }

  uploadFile(
    data: SupportedFileInput | Url | Uuid,
    options: Partial<FileFromOptions> = {}
  ): Promise<UploadcareFile> {
    const settings = this.getSettings()

    return uploadFile(data, populateOptionsWithSettings(options, settings))
  }

  uploadFileGroup(
    data: SupportedFileInput[] | Url[] | Uuid[],
    options: Partial<FileFromOptions & GroupFromOptions> = {}
  ): Promise<UploadcareGroup> {
    const settings = this.getSettings()

    return uploadFileGroup(data, populateOptionsWithSettings(options, settings))
  }
}

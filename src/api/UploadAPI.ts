import UploadClient from '../UploadClient'
import base from './base'
import info from './info'
import fromUrl from './fromUrl'
import fromUrlStatus from './fromUrlStatus'
import group, { GroupOptions } from './group'
import groupInfo from './groupInfo'

/* Types */
import { BaseOptions, FileData, BaseResponse } from './base'
import { FileInfo, GroupId, GroupInfo, Token, Url, Uuid } from './types'
import { InfoOptions } from './info'
import { FromUrlOptions, FromUrlResponse } from './fromUrl'
import { FromUrlStatusOptions, FromUrlStatusResponse } from './fromUrlStatus'
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

    return base(
      file,
      populateOptionsWithSettings<BaseOptions>(options, settings)
    )
  }

  info(uuid: Uuid, options: InfoOptions): Promise<FileInfo> {
    const settings = this.client.getSettings()

    return info(
      uuid,
      populateOptionsWithSettings<InfoOptions>(options, settings)
    )
  }

  fromUrl(sourceUrl: Url, options: FromUrlOptions): Promise<FromUrlResponse> {
    const settings = this.client.getSettings()

    return fromUrl(
      sourceUrl,
      populateOptionsWithSettings<FromUrlOptions>(options, settings)
    )
  }

  fromUrlStatus(
    token: Token,
    options: FromUrlStatusOptions
  ): Promise<FromUrlStatusResponse> {
    const settings = this.client.getSettings()
    const {
      publicKey,
      baseURL,
      cancel,
      integration
    } = populateOptionsWithSettings<FromUrlStatusOptions>(options, settings)

    return fromUrlStatus(token, {
      publicKey,
      baseURL,
      cancel,
      integration
    })
  }

  group(uuids: Uuid[], options: GroupOptions): Promise<GroupInfo> {
    const settings = this.client.getSettings()

    return group(
      uuids,
      populateOptionsWithSettings<GroupOptions>(options, settings)
    )
  }

  groupInfo(id: GroupId, options): Promise<GroupInfo> {
    const settings = this.client.getSettings()

    return groupInfo(id, populateOptionsWithSettings(options, settings))
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

import request, {prepareOptions} from './request'
import base from './base'
import {DirectUpload} from './base'
import UploadClient from '../UploadClient'
import {RequestOptions, RequestResponse} from './request'
import {FileData, Settings, UUID} from '../types'
import info from './info'
import {InfoResponse} from './info'
import fromUrl, {FromUrlRequest, FromUrlResponse} from './fromUrl'
import fromUrlStatus, {FromUrlStatusResponse} from './fromUrlStatus'

export default class UploadAPI {
  client: UploadClient

  constructor(client: UploadClient) {
    this.client = client
  }

  request(options: RequestOptions): Promise<RequestResponse> {
    return request(prepareOptions(options, this.client.settings))
  }

  base(data: FileData, settings: Settings = {}): DirectUpload {
    return base(data, {
      ...this.client.settings,
      ...settings,
    })
  }

  info(uuid: UUID, settings: Settings = {}): Promise<InfoResponse> {
    return info(uuid, {
      ...this.client.settings,
      ...settings,
    })
  }

  fromUrl({sourceUrl, checkForUrlDuplicates, saveUrlForRecurrentUploads}: FromUrlRequest, settings: Settings = {}): Promise<FromUrlResponse> {
    return fromUrl({sourceUrl, checkForUrlDuplicates, saveUrlForRecurrentUploads}, {
      ...this.client.settings,
      ...settings,
    })
  }

  fromUrlStatus(token: UUID, settings: Settings = {}): Promise<FromUrlStatusResponse> {
    return fromUrlStatus(token,  {
      ...this.client.settings,
      ...settings,
    })
  }
}

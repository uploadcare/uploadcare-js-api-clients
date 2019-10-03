import defaultSettings from './defaultSettings'
import UploadAPI from './api/index'
import fileFrom from './fileFrom/fileFrom'
import groupFrom from './groupFrom/groupFrom'

/* Types */
import {FileFromEnum, FileUploadInterface} from './fileFrom/types'
import {FileData, SettingsInterface} from './types'
import {Url} from './api/fromUrl'
import {UploadAPIInterface, Uuid} from './api/types'
import {GroupFromEnum, GroupUploadInterface} from './groupFrom/types'

export interface UploadClientInterface {
  updateSettings(newSettings: SettingsInterface): void

  getSettings(): SettingsInterface

  fileFrom(from: FileFromEnum, data: FileData | Url | Uuid, settings?: SettingsInterface): FileUploadInterface

  groupFrom(from: GroupFromEnum, data: FileData[] | Url[] | Uuid[], settings?: SettingsInterface): GroupUploadInterface
}

class UploadClient implements UploadClientInterface {
  private settings: SettingsInterface
  readonly api: UploadAPIInterface

  constructor(settings: SettingsInterface = {}) {
    this.settings = {
      ...defaultSettings,
      ...settings,
    }
    this.api = new UploadAPI(this)
  }

  updateSettings(newSettings: SettingsInterface = {}): void {
    const prevSettings = {...this.settings}

    this.settings = {
      ...prevSettings,
      ...newSettings,
    }
  }

  getSettings(): SettingsInterface {
    return this.settings
  }

  fileFrom(from: FileFromEnum, data: FileData | Url | Uuid, settings: SettingsInterface = {}): FileUploadInterface {
    return fileFrom(from, data, {
      ...this.settings,
      ...settings,
    })
  }

  groupFrom(from: GroupFromEnum, data: FileData[] | Url[] | Uuid[], settings: SettingsInterface = {}): GroupUploadInterface {
    return groupFrom(from, data, {
      ...this.settings,
      ...settings,
    })
  }
}

export default UploadClient

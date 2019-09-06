import defaultSettings from './defaultSettings'
import UploadAPI from './api/index'
import fileFrom from './fileFrom/fileFrom'
import groupFrom from './groupFrom/groupFrom'

/* Types */
import {
  FileData,
  SettingsInterface,
  UploadcareFileInterface,
  UploadcareGroupInterface,
  UploadClientInterface,
  UploadFromEnum
} from './types'
import {Url} from './api/fromUrl'
import {UploadAPIInterface, Uuid} from './api/types'
import {UploadInterface} from './lifecycle/types'

class UploadClient implements UploadClientInterface {
  protected settings: SettingsInterface
  protected updateSettingsListeners: Function[]
  readonly api: UploadAPIInterface

  constructor(settings: SettingsInterface = {}) {
    this.settings = {
      ...defaultSettings,
      ...settings,
    }
    this.updateSettingsListeners = []
    this.api = new UploadAPI(this)
  }

  /**
   * Update settings with a new ones.
   *
   * @param {SettingsInterface} newSettings
   */
  updateSettings(newSettings: SettingsInterface = {}): void {
    const prevSettings = {...this.settings}

    this.settings = {
      ...prevSettings,
      ...newSettings,
    }

    this.updateSettingsListeners.forEach(listener => {
      listener(prevSettings)
    })
  }

  /**
   * Get current client settings.
   *
   * @return {SettingsInterface}
   */
  getSettings(): SettingsInterface {
    return this.settings
  }

  /**
   * Add callable listener for updated settings.
   * It will be called when the settings change.
   *
   * @param {Function} listener
   * @return {void}
   */
  addUpdateSettingsListener(listener: (settings: SettingsInterface) => void): void {
    this.updateSettingsListeners.push(listener)
  }

  /**
   * Remove callable listener for updated settings.
   *
   * @param {Function} listener
   * @return {void}
   */
  removeUpdateSettingsListener(listener: (settings: SettingsInterface) => void): void {
    for (let index = 0; index < this.updateSettingsListeners.length; index++) {
      if (this.updateSettingsListeners[index] === listener) {
        this.updateSettingsListeners.splice(index, 1)

        break
      }
    }
  }

  /**
   * Upload file.
   *
   * @param {UploadFromEnum} from - Method of uploading.
   * @param {FileData | Url | Uuid} data - Data to upload.
   * @param {SettingsInterface} settings - Client settings.
   * @return {UploadInterface<UploadcareFileInterface>}
   */
  fileFrom(from: UploadFromEnum, data: FileData | Url | Uuid, settings: SettingsInterface = {}): UploadInterface<UploadcareFileInterface> {
    return fileFrom(from, data, {
      ...this.settings,
      ...settings,
    })
  }

  /**
   * Upload group of files.
   *
   * @param {UploadFromEnum} from - Method of uploading.
   * @param {FileData[] | Url[] | Uuid[]} data - Data to upload.
   * @param {SettingsInterface} settings - Client settings.
   * @return {UploadInterface<UploadcareGroupInterface>}
   */
  groupFrom(from: UploadFromEnum, data: FileData[] | Url[] | Uuid[], settings: SettingsInterface = {}): UploadInterface<UploadcareGroupInterface> {
    return groupFrom(from, data, {
      ...this.settings,
      ...settings,
    })
  }
}

export default UploadClient

import defaultSettings from './default-settings'
import UploadAPI from './api'

export default class UploadcareUpload {
  constructor(settings = {}) {
    this.settings = {
      ...defaultSettings,
      ...settings,
    }
    /* TODO Set up user agent */
    this.updateSettingsListeners = []
    this.api = new UploadAPI(this)
  }

  setSettings(newSettings = {}) {
    const prevSettings = {...this.settings}

    this.settings = {
      ...prevSettings,
      ...newSettings,
    }

    this.updateSettingsListeners.forEach(listener => {
      listener(prevSettings)
    })
  }

  addUpdateSettingsListener(listener) {
    this.updateSettingsListeners.push(listener)
  }

  removeUpdateSettingsListener(listener) {
    for (let index = 0; index < this.updateSettingsListeners.length; index++) {
      if (this.updateSettingsListeners[index] === listener) {
        this.updateSettingsListeners.splice(index, 1)

        break
      }
    }
  }
}

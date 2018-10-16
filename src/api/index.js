import axios from 'axios'

export default class {
  constructor(client) {
    this.client = client
    this.axios = axios.create({
      baseURL: this.client.settings.baseURL,
    })

    this.client.addUpdateSettingsListener((prevSettings) => {
      if (prevSettings.baseURL !== this.client.settings.baseURL) {
        this.axios.defaults.baseURL = this.client.settings.baseURL
      }
    })
  }

  request() {
    return `Request to ${this.axios.defaults.baseURL}`
  }
}

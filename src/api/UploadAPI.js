import request from './request'

export default class UploadAPI {
  constructor(client) {
    this.client = client
  }

  request(config, settings = {}) {
    return request(config, {
      ...this.client.settings,
      ...settings,
    })
  }
}

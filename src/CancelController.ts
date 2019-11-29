import {CancelTokenSource} from 'axios'
const {CancelToken} = require('axios')

class CancelController {
  private axiosCancel: CancelTokenSource

  constructor() {
    this.axiosCancel = CancelToken.source()
  }

  cancel() {
    this.axiosCancel.cancel()
  }

  onCancel(fn: Function) {
    this.axiosCancel.token.promise.then(() => fn())
  }

  axiosToken() {
    return this.axiosCancel
  }
}

export default CancelController


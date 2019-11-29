import axios, {CancelTokenSource} from 'axios'

class CancelController {
  private axiosCancel: CancelTokenSource

  constructor() {
    this.axiosCancel = axios.CancelToken.source()
  }

  cancel() {
    this.axiosCancel.cancel()
  }

  onCancel(fn: Function) {
    this.axiosCancel.token.promise.then(() => fn())
  }
}

export default CancelController

